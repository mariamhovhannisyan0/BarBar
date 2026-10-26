import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "BarBar — Հայերեն խոսքի սղագրման համակարգ",
  description:
    "BarBar — Speech-to-Text Transcription Web Platform for Armenian. Խոսքդ՝ բառ առ բառ։",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans bg-slate-50/60 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col selection:bg-indigo-500/15 selection:text-indigo-900 dark:selection:bg-indigo-400/20 dark:selection:text-indigo-200 transition-colors">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200/60 dark:border-zinc-800/60 py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-medium text-slate-600 dark:text-zinc-400">BarBar</span> — Հայերեն խոսքի սղագրում (Standard Eastern Armenian)
              </div>
              <div>
                <span>Խոսքդ՝ բառ առ բառ։</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
