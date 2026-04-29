import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import vitest from "eslint-plugin-vitest";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";

const sharedLanguageOptions: Linter.Config["languageOptions"] = {
    ecmaVersion: 2020,
    globals: {
        ...globals.browser,
        ...globals.node,
        ...vitest.environments.env.globals,
    },
    parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
    },
};

const sharedSettings: Linter.Config["settings"] = {
    react: { version: "detect" },
};

const sharedPlugins = {
    react,
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
    vitest,
} as unknown as NonNullable<Linter.Config["plugins"]>;

const sharedRules: Linter.RulesRecord = {
    ...js.configs.recommended.rules,
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
    ...reactHooks.configs.recommended.rules,
    "react/jsx-no-target-blank": "off",
    "react-refresh/only-export-components": "off",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/set-state-in-render": "off",
    "react/prop-types": "off",
    ...vitest.configs.recommended.rules,
};

const config: Linter.Config[] = [
    {
        ignores: [
            ".next/**",
            "coverage/**",
            "dist/**",
            "node_modules/**",
            "frontend/**",
            "backend/**",
        ],
    },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: sharedLanguageOptions,
        settings: sharedSettings,
        plugins: sharedPlugins,
        rules: {
            ...sharedRules,
            "no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^React$",
                    argsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ...sharedLanguageOptions,
            parser: tseslint.parser,
        },
        settings: sharedSettings,
        plugins: {
            ...sharedPlugins,
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            ...sharedRules,
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^React$",
                    argsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
];

export default config;
