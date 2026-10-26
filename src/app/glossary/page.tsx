"use client";

import { useState, useEffect } from "react";
import { BookOpen, Shield, Plus, Trash2, Check, Sparkles, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function GlossaryContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"glossary" | "special">("glossary");

  // Glossary states
  const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
  const [newStem, setNewStem] = useState("");
  const [newLemma, setNewLemma] = useState("");
  const [newCategory, setNewCategory] = useState("business");

  // Special terms states
  const [specialTerms, setSpecialTerms] = useState<any[]>([]);
  const [newSpecialTerm, setNewSpecialTerm] = useState("");
  const [newSpecialCat, setNewSpecialCat] = useState("brand");

  const [isLoading, setIsLoading] = useState(true);

  const fetchGlossary = async () => {
    try {
      const res = await fetch("/api/glossary");
      const data = await res.json();
      if (data.success) setGlossaryTerms(data.terms || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSpecial = async () => {
    try {
      const res = await fetch("/api/special-terms");
      const data = await res.json();
      if (data.success) setSpecialTerms(data.terms || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([fetchGlossary(), fetchSpecial()]).finally(() => setIsLoading(false));
  }, [user]);

  const handleAddGlossary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStem.trim() || !newLemma.trim()) return;

    try {
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foreignStem: newStem,
          armenianLemma: newLemma,
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlossaryTerms((prev) => [...prev, data.term]);
        setNewStem("");
        setNewLemma("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGlossary = async (id: string) => {
    try {
      await fetch(`/api/glossary?id=${id}`, { method: "DELETE" });
      setGlossaryTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialTerm.trim()) return;

    try {
      const res = await fetch("/api/special-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: newSpecialTerm,
          category: newSpecialCat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpecialTerms((prev) => [...prev, data.term]);
        setNewSpecialTerm("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    try {
      await fetch(`/api/special-terms?id=${id}`, { method: "DELETE" });
      setSpecialTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Համատեքստային բառարան և հատուկ տերմիններ (Special Terms)
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Կառավարեք փոխառյալ բառերի հայերեն համարժեքները և անփոփոխ մնացող հատուկ տերմինները (FR-028 – FR-032)։
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 dark:bg-zinc-900/70 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 max-w-fit">
        <button
          onClick={() => setActiveTab("glossary")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "glossary"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Համատեքստային բառարան ({glossaryTerms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("special")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "special"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Հատուկ տերմիններ (Special Terms) ({specialTerms.length})</span>
        </button>
      </div>

      {/* Tab 1: Glossary */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          {/* Add form */}
          <form
            onSubmit={handleAddGlossary}
            className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle flex flex-wrap items-center gap-3 text-xs"
          >
            <input
              type="text"
              placeholder="Օտար բառարմատ (օր. meeting)"
              value={newStem}
              onChange={(e) => setNewStem(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 flex-1 min-w-[150px]"
              required
            />
            <input
              type="text"
              placeholder="Հայերեն համարժեք (օր. հանդիպում)"
              value={newLemma}
              onChange={(e) => setNewLemma(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 flex-1 min-w-[150px]"
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
            >
              <option value="business">Բիզնես</option>
              <option value="technology">Տեխնոլոգիա</option>
              <option value="everyday">Առօրյա</option>
              <option value="office">Գրասենյակ</option>
            </select>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ավելացնել</span>
            </button>
          </form>

          {/* Terms Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden shadow-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Օտար արմատ</th>
                  <th className="py-3 px-4 font-semibold">Հայերեն համարժեք</th>
                  <th className="py-3 px-4 font-semibold">Կատեգորիա</th>
                  <th className="py-3 px-4 font-semibold">Տեսակ</th>
                  <th className="py-3 px-4 font-semibold text-right">Գործողություն</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {glossaryTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-zinc-100">
                      {term.foreignStem}
                    </td>
                    <td className="py-3 px-4 font-medium text-indigo-600 dark:text-indigo-400">
                      {term.armenianLemma}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px]">
                        {term.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {term.isSystem ? (
                        <span className="text-[10px] text-slate-400">Համակարգային</span>
                      ) : (
                        <span className="text-[10px] text-indigo-600 font-medium">Օգտատիրոջ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!term.isSystem && (
                        <button
                          onClick={() => handleDeleteGlossary(term.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Special Terms (Formerly Protected Terms) */}
      {activeTab === "special" && (
        <div className="space-y-4">
          {/* Add Form */}
          <form
            onSubmit={handleAddSpecial}
            className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle flex flex-wrap items-center gap-3 text-xs"
          >
            <input
              type="text"
              placeholder="Հատուկ տերմին (օր. Google, Python)"
              value={newSpecialTerm}
              onChange={(e) => setNewSpecialTerm(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 flex-1 min-w-[200px]"
              required
            />
            <select
              value={newSpecialCat}
              onChange={(e) => setNewSpecialCat(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
            >
              <option value="brand">Բրենդ / Ապրանքանիշ</option>
              <option value="technology">Տեխնոլոգիա</option>
              <option value="person">Անձնանուն</option>
              <option value="identifier">Նույնականացուցիչ</option>
            </select>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ավելացնել</span>
            </button>
          </form>

          {/* Special Terms Pills Grid */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle">
            <div className="flex flex-wrap gap-2">
              {specialTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60 text-xs"
                >
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{term.term}</span>
                  <span className="text-[10px] text-slate-400">({term.category})</span>
                  {!term.isSystem && (
                    <button
                      onClick={() => handleDeleteSpecial(term.id)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlossaryPage() {
  return (
    <ProtectedRoute sectionName="Բառարան">
      <GlossaryContent />
    </ProtectedRoute>
  );
}
