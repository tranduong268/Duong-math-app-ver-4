
import { AudioAssets, SoundKey } from "../audio/audioAssets";

class AudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;

  // Re-architected state for robust audio unlocking
  private hasInteracted: boolean = false;
  private pendingMusicKey: SoundKey | null = null;

  constructor() {
    this.preload();
  }

  preload() {
    Object.values(AudioAssets).forEach(asset => {
      if (Array.isArray(asset.path)) {
        asset.path.forEach(p => this.createAndCacheAudioElement(p, asset.loop, asset.volume));
      } else {
        this.createAndCacheAudioElement(asset.path, asset.loop, asset.volume);
      }
    });
  }

  private createAndCacheAudioElement(path: string, loop: boolean, volume?: number) {
      if (this.audioCache.has(path)) return;
      const absoluteUrl = new URL(path, window.location.origin).href;
      const audio = new Audio(absoluteUrl);
      audio.loop = loop;
      audio.volume = (volume ?? 1.0) * this.masterVolume;
      audio.preload = 'auto';
      this.audioCache.set(path, audio);
      audio.load();
  }

  // This public method should be called on the first user interaction (e.g., click).
  // It "unlocks" the browser's audio context, allowing sounds to be played programmatically.
  public userHasInteracted = () => {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    
    // Play any music that was queued up before the interaction.
    if (this.pendingMusicKey) {
      const keyToPlay = this.pendingMusicKey;
      this.pendingMusicKey = null;
      this.playMusic(keyToPlay);
    }
  };

  playSound(key: SoundKey) {
    if (this.isMuted) return;

    const asset = AudioAssets[key];
    if (!asset) {
      console.warn(`Sound key "${key}" not found.`);
      return;
    }

    let path: string;
    if (Array.isArray(asset.path)) {
      path = asset.path[Math.floor(Math.random() * asset.path.length)];
    } else {
      path = asset.path;
    }
    
    const originalAudio = this.audioCache.get(path);

    if (originalAudio) {
      // Cloning the audio node is crucial for short, rapid-fire sound effects.
      // It allows multiple instances of the same sound to overlap without cutting each other off.
      const soundToPlay = originalAudio.cloneNode() as HTMLAudioElement;
      soundToPlay.volume = originalAudio.volume; // Volume is not always preserved on clone
      soundToPlay.play().catch(error => {
        // Errors are expected if the user hasn't interacted yet. We can safely ignore NotAllowedError.
        if (error.name !== 'NotAllowedError') {
             console.error(`Error playing sound ${path}:`, error);
        }
      });
    } else {
       console.error(`Audio element for path ${path} not found in cache during playSound.`);
    }
  }

  playMusic(key: SoundKey) {
    // If the user hasn't interacted with the page yet, we can't reliably play audio.
    // We'll queue this music key to be played once interaction occurs.
    if (!this.hasInteracted) {
      this.pendingMusicKey = key;
      return;
    }

    const asset = AudioAssets[key];
    if (!asset || Array.isArray(asset.path)) {
        console.warn(`Music key "${key}" not found or is a sound effect array.`);
        return;
    }
    
    const musicPath = asset.path as string;
    const newMusicElement = this.audioCache.get(musicPath);

    if (!newMusicElement) {
        console.error(`Music element for path ${musicPath} not found in cache.`);
        return;
    }
    
    // If this music is already the active one, just ensure it's playing (if not muted).
    if (this.backgroundMusic === newMusicElement) {
        if (!this.isMuted && this.backgroundMusic.paused) {
             this.backgroundMusic.play().catch(error => console.error(`Error resuming music ${musicPath}:`, error));
        }
        return;
    }

    // Stop any different music that might be playing.
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    
    // Set the new music and play it if not muted.
    this.backgroundMusic = newMusicElement;
    if (!this.isMuted) {
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.play().catch(error => console.error(`Error playing music ${musicPath}:`, error));
    }
  }

  stopMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    // Also clear any pending music that hasn't started
    this.pendingMusicKey = null;
  }

  toggleMute() {
    // Ensure the audio context is active before trying to programmatically change audio state.
    this.userHasInteracted();
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      if (this.backgroundMusic) this.backgroundMusic.pause();
    } else {
      // Un-muted: resume background music if it was paused due to muting.
      if (this.backgroundMusic && this.backgroundMusic.paused) {
        this.backgroundMusic.play().catch(e => console.error("Error resuming music on unmute:", e));
      }
    }
    return this.isMuted;
  }
  
  getIsMuted() {
    return this.isMuted;
  }

  setMutedState(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted && this.backgroundMusic) {
        this.backgroundMusic.pause();
    }
  }
}

export const audioService = new AudioService();
