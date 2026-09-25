// client/src/lib/audioDistressBeacon.ts
/**
 * TRINETRA Distress Beacon (Audio completely disabled per user preference)
 */

class AudioDistressBeacon {
  start(): boolean {
    return false;
  }

  stop() {
    // No-op
  }

  get active(): boolean {
    return false;
  }
}

export const audioDistressBeacon = new AudioDistressBeacon();
