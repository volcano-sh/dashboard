import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { translations } from "./translations";

const I18nContext = createContext(null);

const STORAGE_KEY = "volcano-dashboard-language";
const DEFAULT_LANGUAGE = "en";

const getNestedValue = (object, path) =>
    path.split(".").reduce((acc, segment) => acc?.[segment], object);

const interpolate = (template, values = {}) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

export const I18nProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        if (typeof window === "undefined") {
            return DEFAULT_LANGUAGE;
        }

        return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
    });

    const changeLanguage = useCallback((nextLanguage) => {
        setLanguage(nextLanguage);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, nextLanguage);
        }
    }, []);

    const t = useCallback(
        (key, values) => {
            const template =
                getNestedValue(translations[language], key) ??
                getNestedValue(translations.en, key) ??
                key;
            return interpolate(template, values);
        },
        [language],
    );

    const tStatus = useCallback(
        (status) => {
            const normalized = String(status || "unknown").toLowerCase();
            return t(`status.${normalized}`);
        },
        [t],
    );

    const locale = language === "zh" ? "zh-CN" : "en-US";

    const value = useMemo(
        () => ({
            language,
            setLanguage: changeLanguage,
            locale,
            t,
            tStatus,
        }),
        [changeLanguage, language, locale, t, tStatus],
    );

    return (
        <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error("useTranslation must be used within an I18nProvider");
    }

    return context;
};
