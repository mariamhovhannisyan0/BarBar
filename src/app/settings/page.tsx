"use client";

import { useState, useEffect } from "react";
import { Settings, Sliders, Mic, FileText, Sparkles, Shield, Cpu, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [activeModel, setActiveModel] = useState("taruma/whisper-small-armenian");
  const [armenianization, setArmenianization] = useState(true);
  const [punctuation, setPunctuation] = useState(true);
  const [includeBom, setIncludeBom] = useState(true);
  const [saveLiveAudio, setSaveLiveAudio] = useState(false);
  const [pauseThreshold, setPauseThreshold] = useState("1.8");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    // Load audio devices
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        const audioInputs = devs.filter((d) => d.kind === "audioinput");
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      });
    }

    // Load saved settings from localStorage
    const saved = localStorage.getItem("barbar_user_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.activeModel) setActiveModel(parsed.activeModel);
        if (parsed.armenianization !== undefined) setArmenianization(parsed.armenianization);
        if (parsed.punctuation !== undefined) setPunctuation(parsed.punctuation);
        if (parsed.includeBom !== undefined) setIncludeBom(parsed.includeBom);
        if (parsed.saveLiveAudio !== undefined) setSaveLiveAudio(parsed.saveLiveAudio);
        if (parsed.pauseThreshold) setPauseThreshold(parsed.pauseThreshold);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = () => {
    const settings = {
      activeModel,
      armenianization,
      punctuation,
      includeBom,
      saveLiveAudio,
      pauseThreshold,
      selectedDevice,
    };
    localStorage.setItem("barbar_user_settings", JSON.stringify(settings));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Համակարգի կարգավորումներ
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Կառավարեք խոսափողի, սղագրման մոդելների և տեքստային մշակման պարամետրերը (UI-005, UI-006)։
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all active:scale-95"
        >
          {savedNotice ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedNotice ? "Պահպանվեց" : "Պահպանել կարգավորումները"}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. Hardware & Microphone */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-500" />
            Խոսափողի կարգավորումներ (UI-005)
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Մուտքային ձայնային սարք (Microphone Device)՝
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Խոսափող ${i + 1}`}
                </option>
              ))}
              {devices.length === 0 && <option value="">Լռելյայն խոսափող</option>}
            </select>
          </div>

          <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveLiveAudio}
              onChange={(e) => setSaveLiveAudio(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Պահպանել կենդանի խոսքի աուդիո ձայնագրությունը տեղային պահոցում (default: off)</span>
          </label>
        </div>

        {/* 2. Speech Recognition Model Selection */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            Հայերեն ճանաչման մոդել (FR-027, UI-006)
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Ակտիվ ASR մոդել (Hugging Face Repository ID)՝
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="small">
                whisper-small (Faster-Whisper CTranslate2 — Առաջարկվող իրական հայերեն ASR)
              </option>
              <option value="base">
                whisper-base (Faster-Whisper CTranslate2 — Արագ թեթև մոդել)
              </option>
              <option value="taruma/whisper-small-armenian">
                taruma/whisper-small-armenian (Fine-tuned Whisper on Armenian Common Voice)
              </option>
              <option value="openai/whisper-large-v3-turbo">
                openai/whisper-large-v3-turbo (Multi-Lingual with Armenian Prompt)
              </option>
            </select>
          </div>
        </div>

        {/* 3. Text Processing & Armenianization */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-subtle space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Տեքստային մշակում և հայերենացում
          </h2>

          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={armenianization}
                onChange={(e) => setArmenianization(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <strong>Համատեքստային հայերենացում (Contextual Armenianization)</strong> — փոխառյալ բառերը փոխարինել հայերեն համարժեքներով (FR-029)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={punctuation}
                onChange={(e) => setPunctuation(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <strong>Ինքնաշխատ կետադրություն</strong> — կետերը փոխարինել հայերեն վերջակետով (։), կատարել մեծատառերի ուղղում (FR-034)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBom}
                onChange={(e) => setIncludeBom(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <strong>TXT Byte Order Mark (BOM)</strong> — UTF-8 ֆայլերում ավելացնել BOM նշանը Windows-ի ճիշտ աշխատանքի համար (A-013)
              </span>
            </label>

            <div className="pt-2 flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-zinc-400">
                Պարբերությունների դադարի շեմ (վայրկյան)՝
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10.0"
                value={pauseThreshold}
                onChange={(e) => setPauseThreshold(e.target.value)}
                className="w-20 text-xs py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

