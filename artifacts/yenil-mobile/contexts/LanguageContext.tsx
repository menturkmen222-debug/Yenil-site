import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Lang, type StringKey, t as translate, STRINGS } from "@/lib/i18n";

const STORAGE_KEY = "@yenil_language";

export type { Lang };

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "tk", label: "Türkmençe", flag: "TM" },
  { code: "ru", label: "Русский", flag: "RU" },
  { code: "en", label: "English", flag: "EN" },
  { code: "uz", label: "O'zbekcha", flag: "UZ" },
];

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "tk",
  setLang: () => {},
  t: (key) => translate("tk", key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tk");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in STRINGS) {
        setLangState(saved as Lang);
      }
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const tFn = useCallback(
    (key: StringKey) => translate(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
