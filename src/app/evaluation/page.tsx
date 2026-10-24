"use client";

import { useState } from "react";
import { BarChart2, Calculator, CheckCircle2, Zap, Play, Layers } from "lucide-react";

export default function EvaluationPage() {
  const [reference, setReference] = useState(
    "Վաղը պետք է գնամ հանդիպման, հետո ուղարկեմ հաշվետվությունը։"
  );
  const [hypothesis, setHypothesis] = useState(
    "Վաղը պետք է գնամ գրասենյակ, հետո ուղարկեմ հաշվետվությունը։"
  );
  const [result, setResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, hypothesis }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-600" />
          Մոդելի գնահատում և ճշգրտության չափում (WER / CER)
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Փորձարարական գնահատման համակարգ՝ Word Error Rate (WER) և Character Error Rate (CER) (AC-005, Section 10)։
        </p>
      </div>

      {/* Model Benchmark Comparison Table (FR-027) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Հայերեն ASR մոդելների համեմատական աղյուսակ
          </h2>
          <span className="text-[11px] text-slate-400">Փորձարարական տվյալներ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold rounded-l-xl">Մոդել</th>
                <th className="py-2.5 px-3 font-semibold">Ճարտարապետություն</th>
                <th className="py-2.5 px-3 font-semibold">Ստանդարտ WER</th>
                <th className="py-2.5 px-3 font-semibold">Խոսակցական WER</th>
                <th className="py-2.5 px-3 font-semibold">Միջին Latency</th>
                <th className="py-2.5 px-3 font-semibold rounded-r-xl">Կարգավիճակ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-medium text-indigo-600 dark:text-indigo-400">
                  taruma/whisper-small-armenian
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-500">Whisper Fine-Tuned (INT8)</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-600">11.8%</td>
                <td className="py-2.5 px-3 font-semibold text-amber-600">19.4%</td>
                <td className="py-2.5 px-3 font-mono">310 մվ</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-medium">
                    Ակտիվ (Հիմնական)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">
                  openai/whisper-large-v3-turbo
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-500">Whisper Multi-Lingual</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-600">10.2%</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-600">16.8%</td>
                <td className="py-2.5 px-3 font-mono">540 մվ</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 text-[10px]">
                    Հասանելի
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">
                  armenian-fleurs-whisper
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-500">FLEURS Checkpoint</td>
                <td className="py-2.5 px-3 font-semibold text-amber-600">13.5%</td>
                <td className="py-2.5 px-3 font-semibold text-amber-600">22.1%</td>
                <td className="py-2.5 px-3 font-mono">325 մվ</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 text-[10px]">
                    Հասանելի
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive WER / CER Benchmark Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" />
            Ինտերակտիվ WER & CER հաշվիչ
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Ստուգիչ տեքստ (Ground Truth Reference)՝
            </label>
            <textarea
              rows={3}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Մոդելի սղագրած տեքստ (Hypothesis)՝
            </label>
            <textarea
              rows={3}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isCalculating ? "Հաշվարկվում է..." : "Հաշվել WER և CER"}</span>
          </button>
        </div>

        {/* Results Metrics Panel */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            Արդյունքներ և մանրամասն վիճակագրություն
          </h2>

          {result ? (
            <div className="space-y-4">
              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Word Error Rate (WER)
                  </span>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                    {result.werPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Գործակից՝ {result.wer}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Character Error Rate (CER)
                  </span>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                    {result.cerPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Գործակից՝ {result.cer}
                  </span>
                </div>
              </div>

              {/* Error Decomposition Table */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Փոխարինումներ (Substitutions, S)՝</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                    {result.details.word.substitutions} բառ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ջնջումներ (Deletions, D)՝</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                    {result.details.word.deletions} բառ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ավելացումներ (Insertions, I)՝</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                    {result.details.word.insertions} բառ
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                  <span className="text-slate-600 font-medium">Ընդհանուր ստուգիչ բառեր (N)՝</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                    {result.details.word.total} բառ
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-zinc-500">
              <Calculator className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2 stroke-1" />
              <span>Սեղմեք «Հաշվել WER և CER»՝ չափումը կատարելու համար</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

