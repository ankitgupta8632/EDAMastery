"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { StreakData, UserSettingsData, AdaptiveRecommendation } from "@/types";

interface AppState {
  streak: StreakData | null;
  settings: UserSettingsData | null;
  recommendation: AdaptiveRecommendation | null;
  newAchievements: string[];
  showCelebration: boolean;
}

interface AppContextType extends AppState {
  refreshStreak: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshRecommendation: () => Promise<void>;
  addAchievement: (id: string) => void;
  dismissCelebration: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    streak: null,
    settings: null,
    recommendation: null,
    newAchievements: [],
    showCelebration: false,
  });

  const refreshStreak = useCallback(async () => {
    try {
      const res = await fetch("/api/streak?userId=default-user");
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, streak: data }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?userId=default-user");
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, settings: data }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  const refreshRecommendation = useCallback(async () => {
    try {
      const res = await fetch("/api/adaptive/recommend?userId=default-user");
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, recommendation: data }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  const addAchievement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      newAchievements: [...prev.newAchievements, id],
      showCelebration: true,
    }));
  }, []);

  const dismissCelebration = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCelebration: false,
      newAchievements: [],
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshStreak,
        refreshSettings,
        refreshRecommendation,
        addAchievement,
        dismissCelebration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
