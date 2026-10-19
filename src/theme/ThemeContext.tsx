import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from './tokens';

const ThemeContext = createContext<Theme>(theme);

export interface ThemeProviderProps {
  children: ReactNode;
  customTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, customTheme = theme }) => {
  return <ThemeContext.Provider value={customTheme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    return theme;
  }
  return context;
};

export default ThemeContext;
