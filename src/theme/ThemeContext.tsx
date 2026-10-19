import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { theme, Theme, getColors, ColorTokens, ColorScheme } from './tokens';

interface ThemeValue {
  scheme: ColorScheme;
  colors: ColorTokens;
}

const ThemeContext = createContext<ThemeValue>({ scheme: 'light', colors: getColors('light') });

export interface ThemeProviderProps {
  children: ReactNode;
}

/** Follows the device appearance (light/dark) automatically. */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'dark' ? 'dark' : 'light';
  const value = useMemo(() => ({ scheme, colors: getColors(scheme) }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Colors for the current appearance. */
export const useColors = (): ColorTokens => useContext(ThemeContext).colors;

export const useColorSchemeName = (): ColorScheme => useContext(ThemeContext).scheme;

/** Static tokens plus the current colors, for components that want one object. */
export const useTheme = (): Theme & { colors: ColorTokens } => {
  const { colors } = useContext(ThemeContext);
  return useMemo(() => ({ ...theme, colors }), [colors]);
};

export default ThemeContext;
