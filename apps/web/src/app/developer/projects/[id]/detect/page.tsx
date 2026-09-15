"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { StepWizard } from "@/components/developer/step-wizard";

const STEPS = [
  { id: "import",    label: "Import" },
  { id: "detect",    label: "Detect" },
  { id: "configure", label: "Configure" },
  { id: "release",   label: "Release" },
  { id: "publish",   label: "Publish" },
];

interface DetectedTech {
  language?: string;
  framework?: string;
  packageManager?: string;
  runtime?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
}

type DetectedKey = keyof DetectedTech;

const DETECT_ROWS: { key: DetectedKey; label: string; placeholder: string }[] = [
  { key: "framework",      label: "Framework",       placeholder: "e.g. Next.js" },
  { key: "language",       label: "Language",        placeholder: "e.g. TypeScript" },
  { key: "packageManager", label: "Package Manager", placeholder: "e.g. pnpm" },
  { key: "runtime",        label: "Runtime",         placeholder: "e.g. Node.js" },
  { key: "buildCommand",   label: "Build Command",   placeholder: "e.g. pnpm build" },
  { key: "startCommand",   label: "Start Command",   placeholder: "e.g. pnpm start" },
  { key: "outputDirectory",label: "Output Directory",placeholder: "e.g. .next" },
];

export default function DetectPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [phase, setPhase] = useState<"analyzing" | "result" | "error">("analyzing");
  const [detected, setDetected] = useState<DetectedTech>({});
  const [editing, setEditing] = useState<Set<DetectedKey>>(new Set());
  const [edited, setEdited] = useState<DetectedTech>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.token) return;
    runDetection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const runDetection = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/detect`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user?.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detection failed");
      setDetected(data.detected || {});
      setEdited(data.detected || {});
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
      setPhase("error");
    }
  };

  const toggleEdit = (key: DetectedKey) => {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleChange = (key: DetectedKey, val: string) => {
    setEdited((prev) => ({ ...prev, [key]: val }));
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      // Save edited detected tech + apply to buildConfig
      await fetch(getApiUrl(`/api/developer/apps/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          detectedTech: { ...edited, isEdited: true },
          buildConfig: {
            packageManager: edited.packageManager,
            buildCommand: edited.buildCommand,
            startCommand: edited.startCommand,
            outputDirectory: edited.outputDirectory,
          },
        }),
      });
      router.push(`/developer/projects/${id}/configure`);
    } catch (err) {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Auto Detection</h1>
        <p className="mt-0.5 text-sm text-neutral-500">We analyze your project to detect its tech stack automatically.</p>
      </div>

      <StepWizard steps={STEPS} currentStep="detect" completedSteps={["import"]} />

      {/* Analyzing state */}
      {phase === "analyzing" && (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-neutral-200 bg-white py-20">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-neutral-900 border-r-transparent border-b-transparent border-l-transparent" />
            <Sparkles className="h-8 w-8 text-neutral-700" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-neutral-900">Analyzing your project…</p>
            <p className="mt-1 text-sm text-neutral-500">Detecting framework, language, package manager, and more</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {phase === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-800">Detection failed: {error}</p>
          <button onClick={runDetection} className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition">
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {phase === "result" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <Sparkles className="h-4 w-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-900">Detection results</h2>
              <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Completed
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {DETECT_ROWS.map(({ key, label, placeholder }) => {
                const isEditing = editing.has(key);
                const value = edited[key] || "";
                const isUnknown = !value || value === "Unknown" || value === "";

                return (
                  <div key={key} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-36 shrink-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={value}
                          onChange={(e) => handleChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 font-mono text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                      ) : (
                        <span className={cn(
                          "flex-1 font-mono text-sm",
                          isUnknown ? "text-neutral-400 italic" : "text-neutral-900"
                        )}>
                          {isUnknown ? "Not detected" : value}
                        </span>
                      )}
                      <button
                        onClick={() => toggleEdit(key)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border transition",
                          isEditing
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        )}
                        title={isEditing ? "Save" : "Edit"}
                      >
                        {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Review the detected values above. Click the pencil icon to edit any incorrect value.
            </p>
            <button
              id="detect-continue-btn"
              onClick={handleContinue}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Configure project <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
