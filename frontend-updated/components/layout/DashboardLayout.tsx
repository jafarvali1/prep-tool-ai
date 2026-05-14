"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  candidateName?: string;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
}

export default function DashboardLayout({
  children,
  candidateName,
  onLogout,
  theme,
  onThemeToggle,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar
        candidateName={candidateName}
        onLogout={onLogout}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 lg:mr-0">
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
