
import { SOUND_ASSETS } from '../constants';

class AudioManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private isMuted: boolean = false;

  constructor() {
    // Preload sounds
    Object.entries(SOUND_ASSETS).forEach(([key, url]) => {
      this.sounds[key] = new Audio(url);
    });
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
  }

  play(key: keyof typeof SOUND_ASSETS) {
    if (this.isMuted) return;
    const sound = this.sounds[key];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn("Audio play failed", e));
    }
  }

  stop(key: keyof typeof SOUND_ASSETS) {
    const sound = this.sounds[key];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

export const audioManager = new AudioManager();
