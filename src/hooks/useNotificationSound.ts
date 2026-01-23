import { useRef, useCallback, useEffect } from "react";

// Bell notification sound - pleasant chime
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

// Fallback base64 sound if URL fails
const FALLBACK_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYb/////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB0P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio on first user interaction
  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.6;
      
      // Preload the audio
      audioRef.current.load();
      
      // Set fallback on error
      audioRef.current.onerror = () => {
        audioRef.current = new Audio(FALLBACK_SOUND);
        audioRef.current.volume = 0.6;
      };
    }
    hasInteractedRef.current = true;
  }, []);

  // Play bell sound using Web Audio API (more reliable)
  const playBellSound = useCallback(() => {
    try {
      const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume context if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const now = audioContext.currentTime;
      
      // Create a pleasant bell-like sound with harmonics
      const frequencies = [800, 1200, 1600]; // Bell harmonics
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        // Envelope for bell-like decay
        const volume = 0.15 / (index + 1); // Lower volume for higher harmonics
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        oscillator.start(now);
        oscillator.stop(now + 0.8);
      });
    } catch (error) {
      console.error("Failed to play bell sound:", error);
    }
  }, []);

  // Play notification sound (tries audio file first, falls back to Web Audio)
  const playSound = useCallback(() => {
    if (audioRef.current && hasInteractedRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Fallback to Web Audio API bell
        playBellSound();
      });
    } else {
      // If audio not initialized, use Web Audio
      playBellSound();
    }
  }, [playBellSound]);

  // Test sound function with visual feedback
  const testSound = useCallback(() => {
    initAudio();
    playSound();
  }, [initAudio, playSound]);

  // Add click listener to enable audio on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
    };
    
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [initAudio]);

  return {
    playSound,
    testSound,
    initAudio,
  };
};

export default useNotificationSound;
