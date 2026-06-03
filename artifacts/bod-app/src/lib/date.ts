import {
  format as fnsFormat,
  formatDistanceToNow as fnsFormatDistanceToNow,
} from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { Lang } from "@/contexts/LangContext";
import type { Locale } from "date-fns";

export type DateInput = Date | string | number;

const localeMap: Record<Lang, Locale> = {
  en: enUS,
  ar: arSA,
};

function toDate(value: DateInput): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

/** Format a date using the given date-fns format string and app language locale. */
export function formatDate(value: DateInput, fmt: string, lang: Lang = "en"): string {
  return fnsFormat(toDate(value), fmt, { locale: localeMap[lang] });
}

/** Format a date as a relative string (e.g. "3 hours ago") with app language locale. */
export function formatRelative(value: DateInput, lang: Lang = "en"): string {
  return fnsFormatDistanceToNow(toDate(value), { addSuffix: true, locale: localeMap[lang] });
}

/** Locale-independent ISO date string — safe for <input type="date"> values. */
export function toISODate(value: DateInput): string {
  return fnsFormat(toDate(value), "yyyy-MM-dd");
}
