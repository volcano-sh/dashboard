import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations.js";

export const defaultLanguage = "en";
export const supportedLanguages = ["en", "zh-CN"];

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: translations,
        fallbackLng: defaultLanguage,
        supportedLngs: supportedLanguages,
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            convertDetectedLanguage: (language) =>
                language?.toLowerCase().startsWith("zh")
                    ? "zh-CN"
                    : language,
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
