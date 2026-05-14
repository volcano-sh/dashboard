import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext({ lang: "en", toggle: () => {} });

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(
        () => localStorage.getItem("vc-lang") || "en",
    );

    const toggle = () => {
        setLang((prev) => {
            const next = prev === "en" ? "zh" : "en";
            localStorage.setItem("vc-lang", next);
            return next;
        });
    };

    return (
        <LanguageContext.Provider value={{ lang, toggle }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
