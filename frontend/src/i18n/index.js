import i18n from "i18next";
import LanguageDetector from "i18next-browser-language-detector";
import {initReactI18next} from "react-i18next";
import { translations } from "./translations";

export const defaultLanguage = "en";
export const supportedLanguage = ["en" | "zn-CN"];

i18n.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources: translations,
    fallbackLng: defaultLanguage,
    supportedLng: supportedLanguage,
    detection :{
        order:["localstorage", "navigator"],
        caches: ["localstorage"],
        convertDetectedLanguage :(language)=> 
            language?.toLowerCase().startsWith("zh")
        ? "zh-CN"
        : language

    },
    interpolation: {
        escapeValue: false
    }
})
