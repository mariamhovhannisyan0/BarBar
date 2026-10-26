"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Mic,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ROUTE_LABELS: Record<string, string> = {
  "/history": "Պատմություն",
  "/glossary": "Բառարան",
  "/settings": "Կարգավորումներ",
};

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const protectedRouteName = ROUTE_LABELS[callbackUrl];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Խնդրում ենք լրացնել էլ․ փոստն ու գաղտնաբառը։");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || "Սխալ էլ․ փոստ կամ գաղտնաբառ։");
      } else {
        const target =
          callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
            ? callbackUrl
            : "/history";
        router.push(target);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/register";

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-subtle mx-auto">
            <Mic className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Մուտք գործել BarBar
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Մուտք գործեք՝ «Պատմություն», «Բառարան» և «Կարգավորումներ» բաժիններից օգտվելու համար
          </p>
        </div>

        {/* Redirect Notice */}
        {protectedRouteName && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>«{protectedRouteName}»</strong> բաժինը հասանելի է միայն նույնականացումից (authentication) հետո։ Մուտք գործեք շարունակելու համար։
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
            >
              Էլ․ փոստի հասցե
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
            >
              Գաղտնաբառ
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                aria-label="Ցուցադրել գաղտնաբառը"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 shadow-sm transition-all active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? "Մուտք է գործվում..." : "Մուտք գործել"}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400">
          Չունե՞ք հաշիվ։{" "}
          <Link
            href={registerHref}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Գրանցվել հիմա</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-12 text-center text-xs text-slate-400">
          Բեռնվում է...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

