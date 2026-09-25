// client/src/lib/audio.ts
// Audio sound effects completely disabled per user preference

class AlertSoundSynthesizer {
  playEmergencyTone(_durationMs = 1200) {
    // Silent - all sound disabled
  }

  playNotificationPing() {
    // Silent - all sound disabled
  }
}

export const alertAudio = new AlertSoundSynthesizer();
