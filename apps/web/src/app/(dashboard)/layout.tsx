import Sidebar from "@/components/(dashboard)/layout/sidebar";
import { DemoBanner } from "@/components/(dashboard)/demo-banner";
import React from "react";


type DashboardLayoutProps = {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
        <DemoBanner />
        <div className="flex flex-1">
            <Sidebar />
            <main className="w-full flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    </div>
  )
}