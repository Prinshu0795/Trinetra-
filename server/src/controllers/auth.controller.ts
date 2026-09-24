// server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, phone, role, badgeNumber, department } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role: role || 'CITIZEN',
        badgeNumber,
        department,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        badgeNumber: true,
        department: true,
        createdAt: true,
      },
    });

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

    return sendSuccess(res, { user: newUser, token }, 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
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
