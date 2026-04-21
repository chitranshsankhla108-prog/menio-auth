import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// 1. GLOBAL AUDIO ENGINE
// We keep this outside the function so the browser doesn't destroy it or block it.
let globalAudioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    const savedVolume = localStorage.getItem('menio_notification_volume');
    const currentVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

    if (currentVolume <= 0) return;

    // Initialize if it doesn't exist yet
    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Force it to wake up if the browser suspended it
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().catch(err => console.warn("Browser blocked audio playback:", err));
    }

    const oscillator = globalAudioContext.createOscillator();
    const gainNode = globalAudioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(globalAudioContext.destination);
    
    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(880, globalAudioContext.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(1046.5, globalAudioContext.currentTime + 0.1); // C6 note
    
    const volumeMultiplier = currentVolume * 2;
    const peak1 = Math.min(0.3 * volumeMultiplier, 1.0); 
    const peak2 = Math.min(0.2 * volumeMultiplier, 1.0);

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, globalAudioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(peak1, globalAudioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(peak2, globalAudioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, globalAudioContext.currentTime + 0.3);
    
    oscillator.start(globalAudioContext.currentTime);
    oscillator.stop(globalAudioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio notification not supported:', error);
  }
}

export function useOrderNotifications() {
  const queryClient = useQueryClient();
  const isInitializedRef = useRef(false);

  const handleNewOrder = useCallback(() => {
    playNotificationSound();
  }, []);

  // 2. THE STEALTH UNLOCKER
  // This wakes up the audio engine the very first time the user touches the screen
  useEffect(() => {
    const unlockAudio = () => {
      if (!globalAudioContext) {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume();
      }
      // Clean up the listeners once it's unlocked so it doesn't run on every click
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // 3. SUPABASE LISTENER (FIXED FOR REACT STRICT MODE)
  useEffect(() => {
    const channelName = 'menio-order-sync';

    // FIX: Actively find and destroy any existing ghost channels from Hot Reloads
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) {
        supabase.removeChannel(ch);
      }
    });

    // Create a fresh, guaranteed-clean channel
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          // Only play sound after initial load
          if (isInitializedRef.current) {
            handleNewOrder();
          }
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['todays-revenue'] });
          queryClient.invalidateQueries({ queryKey: ['top-selling-item'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['todays-revenue'] });
        }
      )
      .subscribe((status, err) => {
        // Optional: Helpful for debugging if it ever fails again
        if (err) console.error("Supabase Subscribe Error:", err);
      });

    // Mark as initialized after a short delay to prevent sound on initial load
    const initTimeout = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    return () => {
      clearTimeout(initTimeout);
      supabase.removeChannel(channel);
    };
  }, [queryClient, handleNewOrder]);

  return { playNotificationSound };
}