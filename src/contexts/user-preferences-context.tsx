'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserPreferences } from '@/components/profile-personalization-dialog';

const defaultPreferences: UserPreferences = {
  jobLocationPreference: 'current-country',
  currentCountry: 'India',
  experienceLevel: 'mid',
  workStyle: 'flexible',
  salaryExpectation: {
    currency: 'INR',
    min: 500000,
    max: 1200000,
  },
  industries: [],
  skillsHighlight: [],
  workProfileEnabled: false,
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (preferences: UserPreferences) => void;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage on mount
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    try {
      localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        isLoading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};
