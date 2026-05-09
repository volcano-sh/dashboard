import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import zhCNTranslation from "./locales/zh-CN/translation.json";

const detectDefaultLanguage = () => {
    const envLang = import.meta.env?.VITE_DEFAULT_LANG;
    if (typeof envLang === "string" && envLang.trim()) {
        return envLang.trim();
    }

    if (typeof navigator !== "undefined") {
        const lang = navigator.language || navigator.userLanguage;
        if (typeof lang === "string" && lang.toLowerCase().startsWith("zh")) {
            return "zh-CN";
        }
    }

    return "en";
};

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: enTranslation },
        "zh-CN": { translation: zhCNTranslation },
    },
    lng: detectDefaultLanguage(),
    fallbackLng: "en",
    showSupportNotice: false,
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
