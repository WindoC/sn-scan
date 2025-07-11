'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'theme_preference';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // Default to light theme
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and load saved theme preference
  useEffect(() => {
    console.log('🎨 ThemeProvider: Initializing theme system...');
    setIsHydrated(true);
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    console.log('🎨 ThemeProvider: Saved theme from localStorage:', savedTheme);
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      console.log('🎨 ThemeProvider: Applying saved theme:', savedTheme);
      setTheme(savedTheme);
    } else {
      // Check system preference if no saved preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = systemPrefersDark ? 'dark' : 'light';
      console.log('🎨 ThemeProvider: System prefers:', systemTheme);
      setTheme(systemTheme);
    }
  }, []);

  // Apply theme to document and save preference
  useEffect(() => {
    if (!isHydrated) return;
    
    console.log('🎨 ThemeProvider: Applying theme to document:', theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    console.log('🎨 ThemeProvider: Theme saved to localStorage:', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const newColor = theme === 'dark' ? '#1a1a1a' : '#4F46E5';
      metaThemeColor.setAttribute('content', newColor);
      console.log('🎨 ThemeProvider: Updated meta theme-color to:', newColor);
    }
  }, [theme, isHydrated]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 ThemeProvider: Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isHydrated
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}