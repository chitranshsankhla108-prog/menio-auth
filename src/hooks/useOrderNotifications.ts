import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Exported so you can import and use it in StaffSettings.tsx for the test button
export function playNotificationSound() {
  try {
    // 1. Check local storage for the volume, default to 50% (0.5) if it doesn't exist
    const savedVolume = localStorage.getItem('menio_notification_volume');
    const currentVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

    // 2. If muted, don't even create the audio context
    if (currentVolume <= 0) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for the ping sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6 note
    
    // 3. Apply the volume multiplier to the Gain Node.
    // We multiply by 2 so that a slider at 50% (0.5) plays at your original volume (0.3 peak), 
    // and 100% (1.0) plays twice as loud.
    const volumeMultiplier = currentVolume * 2;
    const peak1 = Math.min(0.3 * volumeMultiplier, 1.0); // Cap at 1.0 to prevent audio clipping/distortion
    const peak2 = Math.min(0.2 * volumeMultiplier, 1.0);

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(peak1, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(peak2, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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

  useEffect(() => {
    const channel = supabase
      .channel('order-notifications')
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
      .subscribe();

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