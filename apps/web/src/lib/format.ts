import type { Locale } from "@/i18n/config";

export function formatDateTime(
  locale: Locale,
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
