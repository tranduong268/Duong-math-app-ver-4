
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { SoundKey } from '../audio/audioAssets';

interface AudioContextType {
  playSound: (key: SoundKey) => void;
  playMusic: (key: SoundKey) => void;
  stopMusic: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

const AUDIO_MUTED_KEY = 'toanHocThongMinh_isMuted';

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const savedState = localStorage.getItem(AUDIO_MUTED_KEY);
      return savedState ? JSON.parse(savedState) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    audioService.setMutedState(isMuted);
  }, [isMuted]);

  const playSound = useCallback((key: SoundKey) => {
    audioService.playSound(key);
  }, []);

  const playMusic = useCallback((key: SoundKey) => {
    audioService.playMusic(key);
  }, []);
  
  const stopMusic = useCallback(() => {
    audioService.stopMusic();
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = audioService.toggleMute();
    setIsMuted(newMutedState);
    try {
      localStorage.setItem(AUDIO_MUTED_KEY, JSON.stringify(newMutedState));
    } catch (e) {
      console.error("Failed to save mute state to localStorage", e);
    }
  }, []);

  const value = { playSound, playMusic, stopMusic, toggleMute, isMuted };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
