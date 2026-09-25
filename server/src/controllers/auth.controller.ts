// server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

/**
 * Returns public system auth status: whether DB is empty (allowing initial bootstrap)
 * or production secured (requiring Admin to create accounts).
 */
export async function getSystemStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const totalUsers = await prisma.user.count();
    return sendSuccess(res, {
      totalUsers,
      allowsBootstrap: totalUsers === 0,
      registrationRestricted: totalUsers > 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new account.
 * - If DB has 0 users: Allows bootstrapping the initial ADMIN account.
 * - If DB has existing users: STRICTLY requires caller to be an authenticated ADMIN.
 * Prevents unauthorized public registration and data leaks.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, phone, role, badgeNumber, department } = req.body;

    const totalUsers = await prisma.user.count();

    // If accounts already exist, only an authenticated ADMIN can create accounts
    if (totalUsers > 0) {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError(
          'Registration is restricted. Only system administrators can provision new accounts.',
          403,
          'REGISTRATION_RESTRICTED'
        );
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      throw new ApiError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Initial bootstrap user is forced to ADMIN
    const assignedRole = totalUsers === 0 ? 'ADMIN' : (role || 'CITIZEN');

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        role: assignedRole,
        badgeNumber: badgeNumber?.trim() || null,
        department: department?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        badgeNumber: true,
        department: true,
        createdAt: true,
      },
    });

    // If this is the initial bootstrap, log the new admin in directly
    if (totalUsers === 0) {
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );
      return sendSuccess(res, { user: newUser, token, isBootstrap: true }, 201);
    }

    // Admin created another account: do not issue token (Admin remains logged in)
    return sendSuccess(
      res,
      {
        user: newUser,
        message: `Account for ${newUser.fullName} (${newUser.role}) successfully created.`,
      },
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      throw new ApiError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    const userProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      badgeNumber: user.badgeNumber,
      department: user.department,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, { user: userProfile, token });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        badgeNumber: true,
        department: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError('User not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

/**
 * List all registered users (Admin only)
 */
export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        badgeNumber: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { users, total: users.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a user account (Admin only)
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    if (req.user?.id === id) {
      throw new ApiError('You cannot delete your own administrative account', 400, 'SELF_DELETE_PREVENTED');
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new ApiError('User not found', 404, 'NOT_FOUND');
    }

    await prisma.user.delete({ where: { id } });

    return sendSuccess(res, { message: `Account for ${targetUser.email} has been deleted.` });
  } catch (error) {
    next(error);
  }
}
