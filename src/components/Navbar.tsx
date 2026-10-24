"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, FileAudio, History, BookOpen, BarChart2, Settings, Sparkles, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  const navItems = [
    { href: "/", label: "Սղագրություն", icon: FileAudio },
    { href: "/history", label: "Պատմություն", icon: History },
    { href: "/glossary", label: "Բառարան", icon: BookOpen },
    { href: "/evaluation", label: "Գնահատում", icon: BarChart2 },
    { href: "/settings", label: "Կարգավորումներ", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-slate-200/70 dark:border-zinc-800/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-subtle group-hover:shadow-glow transition-all">
            <Mic className="w-5 h-5 text-white/95" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-zinc-100">
                BarBar
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
                Armenian ASR
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-light tracking-wide -mt-0.5">
              Խոսքդ՝ բառ առ բառ։
            </span>
          </div>
        </Link>

        {/* Navigation Tabs (Subtle & Delicate) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-zinc-900/70 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600 dark:text-indigo-300" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Engine Badge & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Հայերեն մոդել պատրաստ է</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/60 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

