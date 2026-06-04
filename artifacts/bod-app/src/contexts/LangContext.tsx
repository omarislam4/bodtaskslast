import { createContext, useContext } from "react";
import { translations, type Translations } from "@/locales";

export type Lang = "ar" | "en";

export interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

export const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
  isRTL: false,
});

export const useLang = () => useContext(LangContext);
