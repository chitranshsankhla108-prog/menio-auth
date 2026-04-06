import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// 1. ADDED UPI FIELDS TO THE INTERFACE
export interface Cafe {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  upi_id?: string | null;
  upi_qr_url?: string | null;
}

interface StoredCafeData {
  cafe: Cafe;
  timestamp: number;
}

interface CafeContextType {
  cafe: Cafe | null;
  isLoading: boolean;
  error: string | null;
  setCafeByCode: (code: string) => Promise<boolean>;
  clearCafe: () => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

const CAFE_STORAGE_KEY = 'menio-active-cafe';
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function CafeProvider({ children }: { children: React.ReactNode }) {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isStaff, isLoading: authLoading, staffCafeId } = useAuth();
  const isStaffRef = useRef(isStaff);

  // Keep isStaffRef updated
  useEffect(() => {
    isStaffRef.current = isStaff;
  }, [isStaff]);

  // Auto-set cafe for staff based on their user_roles cafe_id
  useEffect(() => {
    if (authLoading) return;
    if (!isStaff || !staffCafeId) return;
    // If cafe is already set to this cafe, skip
    if (cafe?.id === staffCafeId) return;

    const autoSetStaffCafe = async () => {
      try {
        // 2. CHANGED TO SELECT ALL COLUMNS (*)
        const { data, error: fetchError } = await supabase
          .from('cafes')
          .select('*') 
          .eq('id', staffCafeId)
          .single();

        if (data && !fetchError) {
          const cafeData = data as Cafe;
          setCafe(cafeData);
          const storageData: StoredCafeData = {
            cafe: cafeData,
            timestamp: Date.now(),
          };
          localStorage.setItem(CAFE_STORAGE_KEY, JSON.stringify(storageData));
        }
      } catch (e) {
        console.error('Error auto-setting staff cafe:', e);
      }
    };

    autoSetStaffCafe();
  }, [authLoading, isStaff, staffCafeId, cafe?.id]);

  // Load cafe from localStorage on mount with session expiry check
  useEffect(() => {
    const loadStoredCafe = async () => {
      try {
        const storedData = localStorage.getItem(CAFE_STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData) as StoredCafeData;
          const now = Date.now();
          
          if (!isStaffRef.current && parsed.timestamp && (now - parsed.timestamp > SESSION_TIMEOUT_MS)) {
            localStorage.removeItem(CAFE_STORAGE_KEY);
            setIsLoading(false);
            return;
          }
          
          // 3. CHANGED TO SELECT ALL COLUMNS (*)
          const { data, error } = await supabase
            .from('cafes')
            .select('*')
            .eq('id', parsed.cafe.id)
            .single();
          
          if (data && !error) {
            setCafe(data as Cafe);
          } else {
            localStorage.removeItem(CAFE_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Error loading stored cafe:', e);
        localStorage.removeItem(CAFE_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredCafe();
  }, []);

  // Re-check expiry after auth loads (for accurate staff detection)
  useEffect(() => {
    if (authLoading) return;
    
    const storedData = localStorage.getItem(CAFE_STORAGE_KEY);
    if (storedData && !isStaff) {
      try {
        const parsed = JSON.parse(storedData) as StoredCafeData;
        const now = Date.now();
        if (parsed.timestamp && (now - parsed.timestamp > SESSION_TIMEOUT_MS)) {
          // Session expired for customer
          setCafe(null);
          localStorage.removeItem(CAFE_STORAGE_KEY);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [authLoading, isStaff]);

  // Tab close listener for customers (not staff)
  useEffect(() => {
    if (authLoading) return;

    const handleBeforeUnload = () => {
      // Only clear for non-staff users
      if (!isStaffRef.current) {
        localStorage.removeItem(CAFE_STORAGE_KEY);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authLoading]);

  // FIXED: Changed .toUpperCase() to .toLowerCase() to match Supabase database
  const setCafeByCode = useCallback(async (code: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const normalizedCode = code.trim().toLowerCase(); 
      
      // 4. CHANGED TO SELECT ALL COLUMNS (*)
      const { data, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .eq('code', normalizedCode)
        .single();
      
      if (fetchError || !data) {
        setError('Invalid cafe code. Please check and try again.');
        setIsLoading(false);
        return false;
      }
      
      const cafeData = data as Cafe;
      setCafe(cafeData);
      
      // Store with timestamp
      const storageData: StoredCafeData = {
        cafe: cafeData,
        timestamp: Date.now(),
      };
      localStorage.setItem(CAFE_STORAGE_KEY, JSON.stringify(storageData));
      setIsLoading(false);
      return true;
    } catch (e) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const clearCafe = useCallback(() => {
    setCafe(null);
    localStorage.removeItem(CAFE_STORAGE_KEY);
  }, []);

  return (
    <CafeContext.Provider value={{ cafe, isLoading, error, setCafeByCode, clearCafe }}>
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (context === undefined) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
}