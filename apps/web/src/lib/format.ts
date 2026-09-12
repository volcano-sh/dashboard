import type { Locale } from "@/i18n/config";

export function formatDateTime(
  locale: Locale,
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  if (!date || isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(locale, options).format(date);
}
