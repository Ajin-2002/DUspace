"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Upload, GitBranch, ArrowRight, CheckCircle2, Loader2,
  File as FileIcon, X, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { StepWizard, PIPELINE_STEPS } from "@/components/developer/step-wizard";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

type Tab = "zip" | "github" | "git" | "npm" | "pypi";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "zip",    label: "ZIP Upload",   icon: Upload },
  { id: "github", label: "GitHub",       icon: Github },
  { id: "git",    label: "Git Repo",     icon: GitBranch },
  { id: "npm",    label: "npm",          icon: Package },
  { id: "pypi",   label: "PyPI",         icon: Package },
];

export default function ImportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialSource = (searchParams.get("source") as Tab) || "zip";
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>(initialSource);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [githubUrl, setGithubUrl] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [gitUrl, setGitUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [npmPackage, setNpmPackage] = useState("");
  const [pypiPackage, setPypiPackage] = useState("");

  const authHeaders = { Authorization: `Bearer ${session?.user?.token}` };
  const goNext = () => router.push(`/developer/projects/${id}/analyze`);

  // ── ZIP ───────────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".zip") || f.type === "application/zip"
    );
    if (dropped.length === 0) { setError("Only ZIP files are accepted here."); return; }
    setFiles(dropped);
    setError("");
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
    setError("");
  };

  const uploadZip = async () => {
    if (files.length === 0) { setError("Please select a ZIP file."); return; }
    setIsLoading(true); setError("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      setUploadProgress(0);
      const timer = setInterval(() => setUploadProgress((p) => (p !== null && p < 90 ? p + 10 : p)), 200);
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/upload`), {
        method: "POST", headers: authHeaders, body: formData,
      });
      clearInterval(timer);
      setUploadProgress(100);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSuccess(true);
      setTimeout(goNext, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
      setIsLoading(false);
    }
  };

  // ── GitHub ────────────────────────────────────────────────────────────────
  const importFromGitHub = async () => {
    if (!githubUrl.trim()) { setError("Repository URL is required"); return; }
    setIsLoading(true); setError("");
    try {
      const repoName = githubUrl.split("/").pop()?.replace(".git", "") || "";
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/import/github`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: githubUrl, branch: githubBranch, repoName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSuccess(true);
      setTimeout(goNext, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  // ── Git URL ───────────────────────────────────────────────────────────────
  const importFromGit = async () => {
    if (!gitUrl.trim()) { setError("Git URL is required"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/import/git`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ gitUrl, branch: gitBranch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSuccess(true);
      setTimeout(goNext, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  // ── npm ───────────────────────────────────────────────────────────────────
  const importFromNpm = async () => {
    if (!npmPackage.trim()) { setError("Package name is required"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/import/npm`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ package: npmPackage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSuccess(true);
      setTimeout(goNext, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  // ── PyPI ──────────────────────────────────────────────────────────────────
  const importFromPypi = async () => {
    if (!pypiPackage.trim()) { setError("Package name is required"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/import/pypi`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ package: pypiPackage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSuccess(true);
      setTimeout(goNext, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="text-lg font-semibold text-neutral-900">Import successful!</p>
        <p className="text-sm text-neutral-500">Starting AI analysis…</p>
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 transition";
  const btnCls = "flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Import / Upload</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Choose how to bring your project into DUspace.</p>
      </div>

      <StepWizard steps={PIPELINE_STEPS} currentStep="import" completedSteps={[]} />

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-neutral-200 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(""); }}
              className={cn(
                "flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-medium transition whitespace-nowrap",
                activeTab === tab.id
                  ? "border-b-2 border-neutral-900 text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── ZIP ── */}
          {activeTab === "zip" && (
            <div className="space-y-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition",
                  isDragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100">
                  <Upload className="h-7 w-7 text-neutral-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-900">
                    {isDragging ? "Drop your ZIP here" : "Drag & drop a ZIP file"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">or click to browse — max 500 MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".zip,application/zip" multiple onChange={handleFileInput} className="hidden" />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f) => (
                    <div key={f.name} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <FileIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">{f.name}</p>
                        <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))} className="text-neutral-400 hover:text-red-500 transition">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Uploading…</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-neutral-900 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
              <button id="upload-zip-btn" onClick={uploadZip} disabled={isLoading || files.length === 0} className={btnCls}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload & Analyse</>}
              </button>
            </div>
          )}

          {/* ── GitHub ── */}
          {activeTab === "github" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 flex items-start gap-2">
                <Github className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Paste a public GitHub repository URL. We'll clone the repository and run AI analysis on the files.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Repository URL</label>
                <input id="github-repo-url" type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repository" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Branch</label>
                <input id="github-branch" type="text" value={githubBranch} onChange={(e) => setGithubBranch(e.target.value)} placeholder="main" className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button id="import-github-btn" onClick={importFromGitHub} disabled={isLoading || !githubUrl.trim()} className={btnCls}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><Github className="h-4 w-4" /> Import from GitHub</>}
              </button>
            </div>
          )}

          {/* ── Git URL ── */}
          {activeTab === "git" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Repository URL</label>
                <input id="git-url" type="url" value={gitUrl} onChange={(e) => setGitUrl(e.target.value)} placeholder="https://gitlab.com/user/repo.git" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Branch</label>
                <input id="git-branch" type="text" value={gitBranch} onChange={(e) => setGitBranch(e.target.value)} placeholder="main" className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button id="import-git-btn" onClick={importFromGit} disabled={isLoading || !gitUrl.trim()} className={btnCls}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><GitBranch className="h-4 w-4" /> Import Repository</>}
              </button>
            </div>
          )}

          {/* ── npm ── */}
          {activeTab === "npm" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                <span>Enter an npm package name (e.g. <code className="font-mono">react</code>) or paste the full URL from npmjs.com. We'll fetch the package metadata automatically.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Package name or URL</label>
                <input id="npm-package" type="text" value={npmPackage} onChange={(e) => setNpmPackage(e.target.value)} placeholder="my-package or https://www.npmjs.com/package/my-package" className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button id="import-npm-btn" onClick={importFromNpm} disabled={isLoading || !npmPackage.trim()} className={btnCls}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching…</> : <><Package className="h-4 w-4" /> Import npm Package</>}
              </button>
            </div>
          )}

          {/* ── PyPI ── */}
          {activeTab === "pypi" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                <span>Enter a PyPI package name (e.g. <code className="font-mono">requests</code>) or paste the full URL from pypi.org. We'll fetch the package metadata automatically.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Package name or URL</label>
                <input id="pypi-package" type="text" value={pypiPackage} onChange={(e) => setPypiPackage(e.target.value)} placeholder="my-package or https://pypi.org/project/my-package" className={inputCls} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button id="import-pypi-btn" onClick={importFromPypi} disabled={isLoading || !pypiPackage.trim()} className={btnCls}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching…</> : <><Package className="h-4 w-4" /> Import PyPI Package</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skip */}
      <div className="text-center">
        <button
          onClick={goNext}
          className="text-sm text-neutral-400 underline-offset-4 hover:underline hover:text-neutral-700 transition"
        >
          Skip import — go to AI analysis with current files →
        </button>
      </div>
    </div>
  );
}
