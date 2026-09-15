"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2, Settings2, Sparkles, X } from "lucide-react";
import { EnvVarEditor, EnvVar } from "@/components/developer/env-var-editor";
import { StepWizard, PIPELINE_STEPS } from "@/components/developer/step-wizard";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const PKG_MANAGERS = ["npm", "pnpm", "yarn", "bun", "pip", "conda", "cargo", "go", "maven", "gradle", "composer"];

// ─── AI Badge ────────────────────────────────────────────────────────────────
function AIBadge({ onClear }: { onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
      <Sparkles className="h-2.5 w-2.5" />
      AI suggested
      <button
        type="button"
        onClick={onClear}
        title="Clear AI suggestion"
        className="ml-0.5 rounded-full hover:bg-violet-200 transition"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function BuildField({
  label, aiKey, aiFields, onClearAI, children, mono = false,
}: {
  label: string;
  aiKey: string;
  aiFields: Set<string>;
  onClearAI: (key: string) => void;
  children: React.ReactNode;
  mono?: boolean;
}) {
  const suggested = aiFields.has(aiKey);
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <label className={cn("text-sm font-medium text-neutral-700", mono && "font-mono text-xs")}>
          {label}
        </label>
        {suggested && <AIBadge onClear={() => onClearAI(aiKey)} />}
      </div>
      <div className={cn(suggested && "ring-2 ring-violet-200 rounded-xl")}>
        {children}
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  // Track AI-suggested fields
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());

  // Build config state
  const [runtimeVersion, setRuntimeVersion] = useState("");
  const [packageManager, setPackageManager] = useState("npm");
  const [installCommand, setInstallCommand] = useState("");
  const [buildCommand, setBuildCommand]     = useState("");
  const [startCommand, setStartCommand]     = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [port, setPort]                     = useState<string>("");

  // Env vars
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState("");
  const [hasAI, setHasAI]         = useState(false);

  const authHeaders = { Authorization: `Bearer ${session?.user?.token}` };

  useEffect(() => {
    if (!session?.user?.token) return;
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadProject = async () => {
    try {
      const [projRes, envRes] = await Promise.all([
        fetch(getApiUrl(`/api/developer/apps/${id}`), { headers: authHeaders }),
        fetch(getApiUrl(`/api/developer/apps/${id}/env`), { headers: authHeaders }),
      ]);

      if (projRes.ok) {
        const { app } = await projRes.json();

        // Prefer aiSuggestions.buildConfig if available (from analyze step)
        const ai    = app.aiSuggestions?.buildConfig || {};
        const bc    = app.buildConfig || {};
        const suggested = new Set<string>();

        const pick = (
          aiVal: string | undefined,
          bcVal: string | undefined,
          setter: (v: string) => void,
          key: string,
          defaultVal = ""
        ) => {
          // If ai value exists and differs from backend-stored bc value, it's new
          if (aiVal && aiVal !== "") {
            setter(aiVal);
            if (!bcVal || bcVal === aiVal) suggested.add(key);
          } else if (bcVal && bcVal !== "") {
            setter(bcVal);
          } else {
            setter(defaultVal);
          }
        };

        pick(ai.runtimeVersion,  bc.runtimeVersion,  setRuntimeVersion,  "runtimeVersion");
        pick(ai.packageManager,  bc.packageManager,  setPackageManager,  "packageManager", "npm");
        pick(ai.installCommand,  bc.installCommand,  setInstallCommand,  "installCommand");
        pick(ai.buildCommand,    bc.buildCommand,    setBuildCommand,    "buildCommand");
        pick(ai.startCommand,    bc.startCommand,    setStartCommand,    "startCommand");
        pick(ai.outputDirectory, bc.outputDirectory, setOutputDirectory, "outputDirectory");

        const portVal = ai.port || bc.port;
        if (portVal) {
          setPort(String(portVal));
          suggested.add("port");
        }

        if (suggested.size > 0) {
          setAiFields(suggested);
          setHasAI(true);
        }
      }

      if (envRes.ok) {
        const { envVars: ev } = await envRes.json();
        setEnvVars(ev || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAI = (key: string) => {
    setAiFields((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      await fetch(getApiUrl(`/api/developer/apps/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          buildConfig: {
            runtimeVersion: runtimeVersion.trim(),
            packageManager,
            installCommand: installCommand.trim(),
            buildCommand:   buildCommand.trim(),
            startCommand:   startCommand.trim(),
            outputDirectory: outputDirectory.trim(),
            port: port ? parseInt(port, 10) : undefined,
          },
        }),
      });

      const validEnvVars = envVars.filter((ev) => ev.key.trim());
      if (validEnvVars.length > 0 || envVars.length === 0) {
        await fetch(getApiUrl(`/api/developer/apps/${id}/env`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ envVars: validEnvVars }),
        });
      }

      router.push(`/developer/projects/${id}/releases/new`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 transition";
  const monoCls  = cn(inputCls, "font-mono");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Project Configuration</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Set up build settings and environment variables.</p>
      </div>

      <StepWizard steps={PIPELINE_STEPS} currentStep="configure" completedSteps={["import", "analyze", "review"]} />

      {/* AI callout */}
      {hasAI && aiFields.size > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-violet-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-900">
              Build settings auto-filled from your project
            </p>
            <p className="mt-0.5 text-xs text-violet-700">
              <span className="font-semibold">{aiFields.size} field{aiFields.size !== 1 ? "s" : ""}</span> were
              detected by analysing your uploaded files. Review and adjust as needed — click{" "}
              <span className="font-semibold">✕</span> on any badge to clear a suggestion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAiFields(new Set())}
            className="shrink-0 text-xs text-violet-500 hover:text-violet-700 underline underline-offset-2 transition"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Build Settings */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-neutral-500" />
              <h2 className="text-base font-semibold text-neutral-900">Build settings</h2>
              {aiFields.size > 0 && (
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  {aiFields.size} auto-filled
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BuildField label="Runtime version" aiKey="runtimeVersion" aiFields={aiFields} onClearAI={clearAI}>
                <input
                  id="runtime-version"
                  type="text"
                  value={runtimeVersion}
                  onChange={(e) => setRuntimeVersion(e.target.value)}
                  placeholder="e.g. 20.x, 3.11, 1.21"
                  className={inputCls}
                />
              </BuildField>

              <BuildField label="Package manager" aiKey="packageManager" aiFields={aiFields} onClearAI={clearAI}>
                <select
                  id="package-manager"
                  value={packageManager}
                  onChange={(e) => setPackageManager(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-neutral-900 focus:outline-none transition"
                >
                  {PKG_MANAGERS.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
                </select>
              </BuildField>
            </div>

            <BuildField label="Install command" aiKey="installCommand" aiFields={aiFields} onClearAI={clearAI} mono>
              <input
                id="install-command"
                type="text"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                placeholder="pnpm install"
                className={monoCls}
              />
            </BuildField>

            <BuildField label="Build command" aiKey="buildCommand" aiFields={aiFields} onClearAI={clearAI} mono>
              <input
                id="build-command"
                type="text"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                placeholder="pnpm build"
                className={monoCls}
              />
            </BuildField>

            <BuildField label="Start command" aiKey="startCommand" aiFields={aiFields} onClearAI={clearAI} mono>
              <input
                id="start-command"
                type="text"
                value={startCommand}
                onChange={(e) => setStartCommand(e.target.value)}
                placeholder="pnpm start"
                className={monoCls}
              />
            </BuildField>

            <div className="grid gap-4 sm:grid-cols-2">
              <BuildField label="Output directory" aiKey="outputDirectory" aiFields={aiFields} onClearAI={clearAI} mono>
                <input
                  id="output-dir"
                  type="text"
                  value={outputDirectory}
                  onChange={(e) => setOutputDirectory(e.target.value)}
                  placeholder=".next / dist"
                  className={monoCls}
                />
              </BuildField>

              <BuildField label="Port" aiKey="port" aiFields={aiFields} onClearAI={clearAI} mono>
                <input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3000"
                  min={1}
                  max={65535}
                  className={monoCls}
                />
              </BuildField>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Environment variables</h2>
              <p className="mt-0.5 text-sm text-neutral-500">Configure secrets and runtime variables for your project.</p>
            </div>
            <EnvVarEditor value={envVars} onChange={setEnvVars} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Configuration summary</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: "Package manager", value: packageManager, key: "packageManager" },
                { label: "Build command",   value: buildCommand   || "—", key: "buildCommand" },
                { label: "Start command",   value: startCommand   || "—", key: "startCommand" },
                { label: "Output dir",      value: outputDirectory || "—", key: "outputDirectory" },
                { label: "Port",            value: port            || "—", key: "port" },
                { label: "Env variables",   value: `${envVars.filter(e => e.key).length} defined`, key: "" },
              ].map(({ label, value, key }) => (
                <div key={label} className="flex justify-between gap-2 items-center">
                  <dt className="text-neutral-500 shrink-0">{label}</dt>
                  <dd className="flex items-center gap-1.5 min-w-0">
                    {key && aiFields.has(key) && (
                      <Sparkles className="h-3 w-3 shrink-0 text-violet-400" />
                    )}
                    <span className="font-mono text-xs font-medium text-neutral-900 text-right truncate">{value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            id="save-config-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {isSaving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : <>Save & Create Release <ArrowRight className="h-4 w-4" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
