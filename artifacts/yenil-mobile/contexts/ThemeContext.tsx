import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ThemeKey, themes, themeRadius } from "@/constants/colors";

const STORAGE_KEY = "@yenil_theme";

interface ThemeContextType {
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  colors: typeof themes.green & { radius: number };
}

const ThemeContext = createContext<ThemeContextType>({
  themeKey: "green",
  setTheme: () => {},
  colors: { ...themes.green, radius: themeRadius },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>("green");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in themes) {
        setThemeKey(saved as ThemeKey);
      }
    });
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  }, []);

  const colors = { ...themes[themeKey], radius: themeRadius };

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
