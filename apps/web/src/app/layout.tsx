import type { Metadata } from "next";
import {Inter} from 'next/font/google'
import "./globals.css";
import { cn } from "@/lib/utils";
import {TrpcProvider} from "@volcano/trpc/react"

const fontInter = Inter({subsets: ['latin'], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Volcano",
  description: "Cloud native batch scheduling system for compute-intensive workloads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(fontInter)}
      >
        <TrpcProvider>
        {children}
        </TrpcProvider>
      </body>
    </html>
  );
}
