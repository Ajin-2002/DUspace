"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, RefreshCcw } from "lucide-react";
import { StepWizard, PIPELINE_STEPS } from "@/components/developer/step-wizard";
import { getApiUrl } from "@/lib/api";

const STAGES = [
  { label: "Extracting project files…",         duration: 1200 },
  { label: "Inspecting directory structure…",   duration: 1000 },
  { label: "Detecting tech stack & frameworks…",duration: 1400 },
  { label: "Reading manifest files…",           duration: 1000 },
  { label: "Generating AI suggestions…",        duration: 1600 },
];

type Phase = "analyzing" | "success" | "error";

export default function AnalyzePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [phase, setPhase]           = useState<Phase>("analyzing");
  const [stageIdx, setStageIdx]     = useState(0);
  const [progress, setProgress]     = useState(0);
  const [errorMsg, setErrorMsg]     = useState("");

  const runAnalysis = async () => {
    setPhase("analyzing");
    setStageIdx(0);
    setProgress(0);

    // Animate through stages visually
    let elapsed = 0;
    const total = STAGES.reduce((s, st) => s + st.duration, 0);
    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i);
      setProgress(Math.round((elapsed / total) * 100));
      await new Promise((r) => setTimeout(r, STAGES[i].duration));
      elapsed += STAGES[i].duration;
    }
    setProgress(95);

    // Call backend analyse endpoint
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/analyze`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user?.token}` },
      });

      if (!res.ok) {
        // Fallback: try the detect endpoint (existing backend)
        const detectRes = await fetch(getApiUrl(`/api/developer/apps/${id}/detect`), {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.user?.token}` },
        });
        if (!detectRes.ok) {
          const err = await detectRes.json();
          throw new Error(err.error || "Analysis failed");
        }
        const detectData = await detectRes.json();
        const d = detectData.detected || {};

        // Derive smart defaults from detected tech
        const pm: string = d.packageManager || "npm";
        const pmCmd = (cmd: string) => pm !== "npm" ? cmd.replace("npm run ", `${pm} `) : cmd;

        const suggestedBuildConfig = {
          packageManager:   pm,
          runtimeVersion:   d.runtimeVersion || d.runtime || "",
          installCommand:   d.installCommand  || `${pm} install`,
          buildCommand:     d.buildCommand    || pmCmd("npm run build"),
          startCommand:     d.startCommand    || pmCmd("npm run start"),
          outputDirectory:  d.outputDirectory || "",
        };

        // Save aiSuggestions (for review page) AND pre-populate buildConfig (for configure page)
        await fetch(getApiUrl(`/api/developer/apps/${id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.token}` },
          body: JSON.stringify({
            aiSuggestions: { ...d, buildConfig: suggestedBuildConfig },
            buildConfig: suggestedBuildConfig,
          }),
        });
      } else {
        // analyse endpoint returned suggestions — they're stored server-side
      }

      setProgress(100);
      setPhase("success");
      setTimeout(() => router.push(`/developer/projects/${id}/review`), 700);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!session?.user?.token) return;
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">AI Analysis</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Our AI is inspecting your project to generate smart suggestions.
        </p>
      </div>

      <StepWizard steps={PIPELINE_STEPS} currentStep="analyze" completedSteps={["import"]} />

      {/* Main card */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {phase === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-8 py-16 px-8">
            {/* Animated icon */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              {/* Outer pulse rings */}
              <span className="absolute inset-0 animate-ping rounded-full bg-violet-100 opacity-60" />
              <span className="absolute inset-2 animate-ping rounded-full bg-violet-200 opacity-40" style={{ animationDelay: "300ms" }} />
              {/* Spinning border */}
              <span className="absolute inset-0 rounded-full border-4 border-neutral-100" />
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent" />
              <Sparkles className="h-10 w-10 text-violet-600" />
            </div>

            {/* Stage label */}
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-neutral-900">
                {STAGES[stageIdx]?.label}
              </p>
              <p className="text-sm text-neutral-400">Step {stageIdx + 1} of {STAGES.length}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stage checklist */}
            <div className="w-full max-w-sm space-y-2">
              {STAGES.map((st, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={
                    i < stageIdx
                      ? "h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center"
                      : i === stageIdx
                      ? "h-4 w-4 rounded-full border-2 border-violet-500 bg-violet-50 flex items-center justify-center"
                      : "h-4 w-4 rounded-full border-2 border-neutral-200 bg-white"
                  }>
                    {i < stageIdx && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {i === stageIdx && (
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                    )}
                  </div>
                  <span className={
                    i < stageIdx
                      ? "text-xs text-emerald-600 font-medium"
                      : i === stageIdx
                      ? "text-xs text-violet-700 font-semibold"
                      : "text-xs text-neutral-400"
                  }>
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">Analysis complete!</p>
              <p className="mt-1 text-sm text-neutral-500">Redirecting to review your AI suggestions…</p>
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-500" />
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center justify-center gap-5 py-16 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">Analysis failed</p>
              {errorMsg && <p className="mt-1 text-sm text-red-600">{errorMsg}</p>}
              <p className="mt-2 text-sm text-neutral-500">
                Don't worry — you can still fill in the details manually.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runAnalysis}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                <RefreshCcw className="h-4 w-4" /> Retry
              </button>
              <button
                onClick={() => router.push(`/developer/projects/${id}/review`)}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition"
              >
                Continue anyway →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
