import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    const isDark = typeof window !== 'undefined' && (
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    );
    const fallbackTheme: Theme = isDark ? 'dark' : 'light';
    return {
      theme: fallbackTheme,
      toggleTheme: () => {
        if (typeof window !== 'undefined') {
          const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(next);
          localStorage.setItem('theme', next);
        }
      }
    };
  }
  return context;
}
