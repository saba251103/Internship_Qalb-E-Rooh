// context/SettingsContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SettingsContextType = {
  arabicFontSize: number;
  setArabicFontSize: (size: number) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [arabicFontSize, setArabicFontSize] = useState(38);

  useEffect(() => {
    // Load the user's saved font preference on app launch
    AsyncStorage.getItem('arabicFontSize').then(val => {
      if (val) setArabicFontSize(parseInt(val));
    });
  }, []);

  const updateSize = (size: number) => {
    setArabicFontSize(size);
    AsyncStorage.setItem('arabicFontSize', size.toString());
  };

  return (
    <SettingsContext.Provider value={{ arabicFontSize, setArabicFontSize: updateSize }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};