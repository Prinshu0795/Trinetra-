// client/src/lib/audio.ts
// Web Audio API emergency alert tone generator (requires zero external audio file dependencies)

class AlertSoundSynthesizer {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Dual-frequency alarm tone for high/critical warnings (853Hz + 960Hz standard EAS tone)
  playEmergencyTone(durationMs = 1200) {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.value = 853;
      osc2.frequency.value = 960;

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch {}
      }, durationMs);
    } catch (e) {
      console.warn('Web Audio playback failed or blocked by autoplay policy:', e);
    }
  }

  // Gentle double-ping notification for advisories
  playNotificationPing() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
      }, 400);
    } catch (e) {
      console.warn('Web Audio ping failed:', e);
    }
  }
}

export const alertAudio = new AlertSoundSynthesizer();
