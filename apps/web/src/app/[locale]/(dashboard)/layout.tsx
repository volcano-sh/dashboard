import Sidebar from "@/components/(dashboard)/layout/sidebar";
import React from "react";


type DashboardLayoutProps = {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex">
        <Sidebar />
        <main className="w-full flex-1 overflow-hidden">
            {children}
        </main>
    </div>
  )
}