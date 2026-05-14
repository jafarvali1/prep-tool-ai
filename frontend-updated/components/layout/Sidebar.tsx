"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Mic, LogOut, Menu, X, Moon, Sun } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  candidateName?: string;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
}

export default function Sidebar({
  candidateName = "Candidate",
  onLogout,
  theme = "dark",
  onThemeToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Preparation Hub", href: "/preparation-hub", icon: BookOpen },
    { label: "Interview", href: "/interview", icon: Mic },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="px-6 py-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">W</span>
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white">WBL PrepHub</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">AI Coach</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              isActive(item.href)
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-600"
                : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700/50 space-y-3">
        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="text-xs font-600 text-gray-500 dark:text-gray-400">LOGGED IN AS</div>
          <div className="text-sm font-600 text-gray-900 dark:text-white truncate mt-1">
            {candidateName}
          </div>
        </div>

        <button
          onClick={onThemeToggle}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
            "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          )}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button
          onClick={() => {
            setIsOpen(false);
            onLogout?.();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="text-sm font-600">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-indigo-600 text-white rounded-full shadow-lg lg:hidden hover:bg-indigo-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700/50 fixed h-screen left-0 top-0">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <aside className="absolute left-0 top-0 w-64 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700/50 shadow-xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
