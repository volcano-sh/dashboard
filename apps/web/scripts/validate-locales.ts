import fs from "fs";
import path from "path";

const messagesDir = path.join(__dirname, "../messages");
const locales = ["en", "zh-CN"];
const sourceLocale = "en";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

function loadNamespace(locale: string, namespace: string): Record<string, unknown> {
  const filePath = path.join(messagesDir, locale, `${namespace}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadLocaleKeys(locale: string): Set<string> {
  const localeDir = path.join(messagesDir, locale);
  const namespaces = fs
    .readdirSync(localeDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  const keys = namespaces.flatMap((ns) => {
    const data = loadNamespace(locale, ns);
    return collectKeys(data).map((k) => `${ns}.${k}`);
  });

  return new Set(keys);
}

function main() {
  const sourceKeys = loadLocaleKeys(sourceLocale);
  let hasError = false;

  for (const locale of locales) {
    if (locale === sourceLocale) continue;

    const localeKeys = loadLocaleKeys(locale);
    const missing = Array.from(sourceKeys).filter((k) => !localeKeys.has(k));
    const extra = Array.from(localeKeys).filter((k) => !sourceKeys.has(k));

    if (missing.length > 0) {
      hasError = true;
      console.error(`\n[${locale}] Missing keys (${missing.length}):`);
      missing.forEach((k) => console.error(`  - ${k}`));
    }

    if (extra.length > 0) {
      hasError = true;
      console.error(`\n[${locale}] Extra keys (${extra.length}):`);
      extra.forEach((k) => console.error(`  - ${k}`));
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log("All locale message keys are in sync.");
}

main();
