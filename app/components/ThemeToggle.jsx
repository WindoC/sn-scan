'use client';

import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme();

  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return (
      <button className="theme-toggle loading" disabled>
        🌓
      </button>
    );
  }

  const handleToggle = () => {
    console.log('🎨 ThemeToggle: User clicked theme toggle button');
    toggleTheme();
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={handleToggle}
      title={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}
      aria-label={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}