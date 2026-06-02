import en from "./en";
import ar from "./ar";

export const translations = { en, ar } as const;
export type Translations = typeof en;
export type TranslationKeys = keyof Translations;
export type Lang = keyof typeof translations;
// Allowed value types for any translation entry
export type TranslationValue = string | ((...args: any[]) => string);