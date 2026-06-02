import en from "./en";
import ar from "./ar";

export const translations = { en, ar } as const;
export type Translations = typeof en;
