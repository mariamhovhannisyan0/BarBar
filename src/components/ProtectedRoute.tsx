"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  sectionName?: string;
}

export function ProtectedRoute({ children, sectionName }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center mb-3 animate-pulse">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          Ստուգվում է նույնականացումը...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Անհրաժեշտ է մուտք գործել համակարգ
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {sectionName ? `«${sectionName}»` : "Այս"} բաժինը հասանելի է միայն գրանցված և նույնականացված օգտատերերին։
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Մուտք գործել</span>
          </Link>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(pathname)}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Գրանցվել</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

