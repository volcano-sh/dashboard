import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { TrpcProvider } from "@volcano/trpc/react";
import { routing } from "@/i18n/routing";
import { getDirection, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import "../globals.css";

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontNotoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-sc",
});

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const isZh = locale === "zh-CN";

  return (
    <html
      lang={locale}
      dir={getDirection(locale as Locale)}
      suppressHydrationWarning
    >
      <body className={cn(isZh ? fontNotoSansSC.className : fontInter.className)}>
        <NextIntlClientProvider messages={messages}>
          <TrpcProvider>{children}</TrpcProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
