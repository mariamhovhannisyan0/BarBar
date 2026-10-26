"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  FileAudio,
  History,
  BookOpen,
  BarChart2,
  Settings,
  Moon,
  Sun,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    document.documentElement.classList.toggle("dark", shouldBeDark);
    document.documentElement.style.colorScheme = shouldBeDark ? "dark" : "light";
    setIsDark(shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };

  const navItems = [
    { href: "/", label: "Սղագրություն", icon: FileAudio, requiresAuth: false },
    { href: "/history", label: "Պատմություն", icon: History, requiresAuth: true },
    { href: "/glossary", label: "Բառարան", icon: BookOpen, requiresAuth: true },
    { href: "/evaluation", label: "Գնահատում", icon: BarChart2, requiresAuth: false },
    { href: "/settings", label: "Կարգավորումներ", icon: Settings, requiresAuth: true },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-slate-200/70 dark:border-zinc-800/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Slogan */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-subtle group-hover:shadow-glow transition-all">
            <Mic className="w-5 h-5 text-white/95" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-zinc-100">
                BarBar
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 whitespace-nowrap">
                Armenian ASR
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-light tracking-wide -mt-0.5 whitespace-nowrap">
              Խոսքդ՝ բառ առ բառ։
            </span>
          </div>
        </Link>

        {/* Navigation Tabs (Subtle & Delicate) */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100/70 dark:bg-zinc-900/70 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isLocked = item.requiresAuth && !user;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isLocked ? `${item.label} (Անհրաժեշտ է մուտք գործել)` : item.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-indigo-600 dark:text-indigo-300" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
                {isLocked && !isLoading && (
                  <Lock className="w-3 h-3 text-slate-400/80 dark:text-zinc-500 ml-0.5 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Engine Badge, Auth Actions & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 text-[11px] leading-none text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-medium">Հայերեն մոդել պատրաստ է</span>
          </div>

          {!isLoading && (
            <>
              {user ? (
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div
                    title={user.email}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 whitespace-nowrap"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="max-w-[110px] truncate">{user.fullName}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="Դուրս գալ համակարգից"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden lg:inline">Ելք</span>
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <Link
                    href="/login"
                    className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      pathname === "/login"
                        ? "bg-slate-200/70 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                        : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" />
                    <span>Մուտք</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm whitespace-nowrap transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Գրանցում</span>
                  </Link>
                </div>
              )}
            </>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/60 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLocked = item.requiresAuth && !user;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            {user ? (
              <>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {user.fullName}
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ելք</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                >
                  Մուտք
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
                >
                  Գրանցում
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
