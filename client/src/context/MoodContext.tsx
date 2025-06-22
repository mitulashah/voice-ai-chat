import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import type { Mood } from './mood-types';
import { useAuth } from './AuthContext';



interface MoodContextData {
  moods: Mood[];
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  loading: boolean;
  error: string | null;
}

const MoodContext = createContext<MoodContextData>({
  moods: [],
  selectedMood: null,
  setSelectedMood: () => {},
  loading: false,
  error: null,
});

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch moods when authenticated and not loading
    if (isAuthenticated && !authLoading) {
      setLoading(true);
      apiClient.get<{ moods: Mood[] }>('/api/moods')
        .then(res => {
          setMoods(res.data.moods || []);
          setError(null);
        })
        .catch(() => setError('Failed to load moods'))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading]);

  return (
    <MoodContext.Provider value={{ moods, selectedMood, setSelectedMood, loading, error }}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = () => useContext(MoodContext);
