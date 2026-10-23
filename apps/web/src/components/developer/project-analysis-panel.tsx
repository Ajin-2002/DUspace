"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Play, RefreshCcw, X } from "lucide-react";
import { getApiUrl } from "@/lib/api";

type Job = {
  id: string;
  projectId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  currentStage: string;
  progress: number;
  attemptCount: number;
  analysisVersion: number;
  cancelRequested: boolean;
  error?: string;
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
};
type Finding = {
  category: string;
  severity: string;
  title: string;
  description: string;
  fileReference?: string;
  lineStart?: number;
  evidenceType: "confirmed" | "inferred";
  confidence: number;
  remediation?: string;
};
type InventoryFile = {
  path: string;
  extension: string;
  category: string;
  size: number;
  sha256: string;
  parseStatus: string;
};
type Report = {
  analysisVersion: number;
  summary: { description: string; primaryFramework: string | null; languages: string[] };
  inventory: { fileCount: number; sourceFileCount: number; assetCount: number; testFileCount: number; skippedFileCount: number; totalSizeBytes: number };
  technologies: Array<{ name: string; kind: string; confidence: number; evidence: string[] }>;
  architecture: {
    entryPoints: string[];
    routes: Array<{ path: string; framework: string; file: string; type: string; confidence: number; dynamic: boolean }>;
    layouts: string[];
    apiEndpoints: Array<{ path: string; framework: string; file: string; type: string; confidence: number; dynamic: boolean }>;
    dataModels: string[];
    authenticationPatterns: Array<{ name: string; evidence: string[]; confidence: number }>;
    environmentVariables: string[];
    externalIntegrations: string[];
  };
  uiInventory: {
    pages: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    components: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    navigation: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    forms: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    designTokens: string[];
    stylingSystems: string[];
    responsiveIndicators: string[];
  };
  dependencies: {
    packageManager: string | null;
    direct: Array<{ name: string; version: string; source: string; confidence: number }>;
    development: Array<{ name: string; version: string; source: string; confidence: number }>;
    observedImports: string[];
    lockfile: string | null;
    scripts: Record<string, string>;
    declaredRuntime: Record<string, string>;
  };
  quality: { findingsCount: number; checksCompleted: string[]; checksSkipped: string[]; limitations: string[] };
  metadata: { generatedAt: string; status: "completed" | "incomplete" };
};

const TABS = ["Overview", "Architecture", "Pages & routes", "UI inventory", "File inventory", "Dependencies", "Quality & security", "History"] as const;
type Tab = (typeof TABS)[number];

function confidence(value: number): string {
  return Math.round(value * 100) + "% confidence";
}

function statusStyle(status: string): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  if (status === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-700";
}

function ReportList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return <ul className="space-y-2">{items.map((item) => <li key={item} className="break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{item}</li>)}</ul>;
}

function RouteTable({ routes }: { routes: Report["architecture"]["routes"] }) {
  if (!routes.length) return <p className="text-sm text-slate-500">No routes were confirmed by static analysis.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="text-slate-500"><tr><th className="px-3 py-2 font-medium">Route</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Evidence</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{routes.map((route) => <tr key={route.file + route.path + route.type}>
          <td className="px-3 py-2 font-mono font-medium text-slate-900">{route.path}{route.dynamic ? " · dynamic" : ""}</td>
          <td className="px-3 py-2 capitalize text-slate-600">{route.type.toLowerCase()}</td>
          <td className="px-3 py-2 font-mono text-slate-600">{route.file}</td>
          <td className="px-3 py-2 text-slate-500">{route.framework} · {confidence(route.confidence)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export function ProjectAnalysisPanel({ projectId, token, ready }: { projectId: string; token?: string; ready: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [savedReport, setSavedReport] = useState<Report | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingPage, setFindingPage] = useState(1);
  const [findingPages, setFindingPages] = useState(1);
  const [findingTotal, setFindingTotal] = useState(0);
  const [analysisFiles, setAnalysisFiles] = useState<InventoryFile[]>([]);
  const [filePage, setFilePage] = useState(1);
  const [filePages, setFilePages] = useState(1);
  const [fileTotal, setFileTotal] = useState(0);
  const [fileSearch, setFileSearch] = useState("");
  const [fileCategory, setFileCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const report = savedReport?.analysisVersion === job?.analysisVersion ? savedReport : null;
  const jobId = job?.id;
  const jobStatus = job?.status;

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!token) throw new Error("Sign in as a developer to analyze this project.");
    const response = await fetch(getApiUrl(path), {
      ...init,
      headers: { Authorization: "Bearer " + token, ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The analysis request could not be completed.");
    return data;
  }, [token]);

  const loadStatus = useCallback(async (analysisId: string) => {
    const data = await request("/api/v1/analyses/" + analysisId);
    setJob(data.job);
    setJobs((current) => current.map((item) => item.id === data.job.id ? data.job : item));
  }, [request]);

  const loadHistory = useCallback(async () => {
    if (!token || !ready) { setLoading(false); return; }
    try {
      setError("");
      const data = await request("/api/v1/projects/" + projectId + "/analyses?page=1&limit=30");
      const nextJobs: Job[] = data.jobs ?? [];
      setJobs(nextJobs);
      setJob((current) => {
        const selected = current && nextJobs.find((item) => item.id === current.id);
        return selected ?? nextJobs[0] ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Analysis history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [projectId, ready, request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadHistory(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  useEffect(() => {
    if (!jobId || (jobStatus !== "queued" && jobStatus !== "running")) return;
    const timer = window.setInterval(() => { void loadStatus(jobId).catch(() => undefined); }, 1800);
    return () => window.clearInterval(timer);
  }, [jobId, jobStatus, loadStatus]);

  useEffect(() => {
    if (!jobId || jobStatus !== "completed") return;
    let cancelled = false;
    void (async () => {
      try {
        const reportData = await request("/api/v1/analyses/" + jobId + "/report");
        if (!cancelled) setSavedReport(reportData.report);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "The report could not be loaded.");
      }
    })();
    return () => { cancelled = true; };
  }, [jobId, jobStatus, request]);

  useEffect(() => {
    if (!jobId || jobStatus !== "completed") return;
    let cancelled = false;
    const params = new URLSearchParams({ page: String(findingPage), limit: "10" });
    if (severity) params.set("severity", severity);
    if (category) params.set("category", category);
    void request("/api/v1/analyses/" + jobId + "/findings?" + params.toString()).then((data) => {
      if (!cancelled) {
        setFindings(data.findings ?? []);
        setFindingPages(data.pagination?.pages ?? 1);
        setFindingTotal(data.pagination?.total ?? 0);
      }
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Findings could not be loaded.");
    });
    return () => { cancelled = true; };
  }, [jobId, jobStatus, findingPage, severity, category, request]);

  useEffect(() => {
    if (!jobId || jobStatus !== "completed" || tab !== "File inventory") return;
    let cancelled = false;
    const params = new URLSearchParams({ page: String(filePage), limit: "25" });
    if (fileSearch.trim()) params.set("q", fileSearch.trim());
    if (fileCategory) params.set("category", fileCategory);
    void request("/api/v1/analyses/" + jobId + "/files?" + params.toString()).then((data) => {
      if (!cancelled) {
        setAnalysisFiles(data.files ?? []);
        setFilePages(data.pagination?.pages ?? 1);
        setFileTotal(data.pagination?.total ?? 0);
      }
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "The file inventory could not be loaded.");
    });
    return () => { cancelled = true; };
  }, [jobId, jobStatus, tab, filePage, fileSearch, fileCategory, request]);

  async function startAnalysis() {
    setWorking(true);
    setError("");
    try {
      const data = await request("/api/v1/projects/" + projectId + "/analyses", { method: "POST" });
      setJob(data.job);
      setJobs((current) => [data.job, ...current]);
      setSavedReport(null);
      setTab("Overview");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Analysis could not be started.");
    } finally {
      setWorking(false);
    }
  }

  async function jobAction(action: "cancel" | "retry") {
    if (!job) return;
    setWorking(true);
    setError("");
    try {
      const data = await request("/api/v1/analyses/" + job.id + "/" + action, { method: "POST" });
      setJob(data.job);
      if (action === "retry") {
        setJobs((current) => [data.job, ...current]);
        setSavedReport(null);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The analysis request could not be completed.");
    } finally {
      setWorking(false);
    }
  }

  async function chooseHistory(item: Job) {
    setJob(item);
    setSavedReport(null);
    setError("");
    setTab(item.status === "completed" ? "Overview" : "History");
    try { await loadStatus(item.id); } catch {}
  }

  const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const active = job?.status === "queued" || job?.status === "running";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Project analysis</h2>
            {job && <span className={"rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide " + statusStyle(job.status)}>{job.status}</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">Evidence-backed inventory, architecture, routes and static checks. Source files are never executed.</p>
        </div>
        {active ? (
          <button type="button" disabled={working} onClick={() => void jobAction("cancel")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Cancel
          </button>
        ) : job?.status === "failed" || job?.status === "cancelled" ? (
          <button type="button" disabled={!ready || working} onClick={() => void jobAction("retry")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Retry analysis
          </button>
        ) : (
          <button type="button" disabled={!ready || working} onClick={() => void startAnalysis()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Analyze project
          </button>
        )}
      </div>

      {job && active && <div className={panel}>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium capitalize text-slate-800">{job.currentStage.replaceAll("_", " ")}</span>
          <span className="tabular-nums text-slate-500">{job.progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-800 transition-[width] duration-500" style={{ width: job.progress + "%" }} />
        </div>
        {job.cancelRequested && <p className="mt-2 text-xs text-slate-500">Cancellation requested. The worker will stop at its next safe checkpoint.</p>}
      </div>}

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {job?.status === "failed" && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <p>{job.error || "Analysis failed. Retry to start a new analysis."}</p>
        {job.errorCode && <p className="mt-2 text-xs text-rose-700">Diagnostic code: <code className="rounded bg-rose-100 px-1.5 py-0.5 font-mono">{job.errorCode}</code></p>}
      </div>}
      {loading && !job && <div className={panel}><div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading analysis history…</div></div>}
      {!loading && !job && ready && <div className={panel}><div className="flex min-h-36 flex-col items-center justify-center text-center"><CheckCircle2 className="h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-900">This project has not been analyzed yet</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">Start a deterministic scan to create a versioned blueprint of the imported files, dependencies, routes and UI candidates.</p></div></div>}
      {!ready && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Complete the project import before starting analysis.</div>}

      {job && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2">
          {TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={"shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition " + (tab === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>{item}</button>)}
        </div>
        <div className="min-h-56 p-4 sm:p-5">
          {tab !== "History" && job.status !== "completed" && <div className="flex min-h-48 flex-col items-center justify-center text-center">
            {job.status === "failed" ? <AlertTriangle className="h-7 w-7 text-rose-500" /> : job.status === "cancelled" ? <X className="h-7 w-7 text-slate-400" /> : <Loader2 className="h-7 w-7 animate-spin text-slate-500" />}
            <p className="mt-3 text-sm font-semibold text-slate-900">{job.status === "queued" ? "Waiting for an analysis worker" : job.status === "running" ? "Analysis is in progress" : job.status === "failed" ? "Analysis did not complete" : "Analysis was cancelled"}</p>
            <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">{job.error || "This page will update with the saved report when the job completes."}</p>
          </div>}

          {tab === "Overview" && job.status === "completed" && (report ? <div className="space-y-5">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Analysis version {job.analysisVersion}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">{report.summary.primaryFramework || "Project overview"}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{report.summary.description}</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Files inventoried", report.inventory.fileCount.toLocaleString()],
                ["Source files", report.inventory.sourceFileCount.toLocaleString()],
                ["Languages", report.summary.languages.join(", ") || "Unclassified"],
                ["Findings", String(report.quality.findingsCount)],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>)}
            </div>
            <div className="flex flex-wrap gap-2">{report.technologies.map((technology) => <span key={technology.name} title={technology.evidence.join("; ")} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">{technology.name} · {confidence(technology.confidence)}</span>)}</div>
            {report.metadata.status === "incomplete" && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Some source files could not be fully parsed. Review the skipped-file count and parse findings.</p>}
            <p className="text-xs text-slate-500">Generated {new Date(report.metadata.generatedAt).toLocaleString()}. Findings include source references and confidence; the report does not claim runtime or security completeness.</p>
          </div> : <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading report…</div>)}

          {tab === "Architecture" && report && <div className="grid gap-5 lg:grid-cols-2">
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Entry points and layouts</h3><ReportList items={[...report.architecture.entryPoints.map((item) => "Entry · " + item), ...report.architecture.layouts.map((item) => "Layout · " + item)]} empty="No entry points or layouts were identified." /></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Data models</h3><ReportList items={report.architecture.dataModels} empty="No model or schema candidates were detected." /></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Authentication indicators</h3>{report.architecture.authenticationPatterns.length ? report.architecture.authenticationPatterns.map((pattern) => <div key={pattern.name} className="space-y-2"><p className="text-sm font-medium">{pattern.name} · {confidence(pattern.confidence)}</p><ReportList items={pattern.evidence} empty="No source evidence." /></div>) : <p className="text-sm text-slate-500">No authentication indicators were detected. This does not confirm the absence of authentication.</p>}</div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Environment variable names</h3><p className="mb-3 text-xs text-slate-500">Names only; values are never included.</p><ReportList items={report.architecture.environmentVariables} empty="No environment variable references were detected." /></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">External integrations</h3><ReportList items={report.architecture.externalIntegrations} empty="No supported integration packages were detected." /></div>
          </div>}

          {tab === "Pages & routes" && report && <div className="space-y-5"><div><h3 className="mb-3 text-sm font-semibold text-slate-900">Detected routes</h3><RouteTable routes={report.architecture.routes} /></div><div><h3 className="mb-3 text-sm font-semibold text-slate-900">API endpoints</h3><RouteTable routes={report.architecture.apiEndpoints} /></div><p className="text-xs text-slate-500">Routes are statically detected and may be incomplete when registration is dynamic.</p></div>}

          {tab === "UI inventory" && report && <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                ["Pages", report.uiInventory.pages],
                ["Components", report.uiInventory.components],
                ["Navigation", report.uiInventory.navigation],
                ["Forms", report.uiInventory.forms],
              ].map(([label, raw]) => {
                const items = raw as Report["uiInventory"]["components"];
                return <div key={label as string} className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">{label as string} <span className="text-slate-400">({items.length})</span></h3>{items.length ? <ul className="space-y-3">{items.slice(0, 100).map((item) => <li key={item.file + item.name} className="border-b border-slate-100 pb-3 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-slate-900">{item.name} <span className="text-xs font-normal text-slate-500">· {item.role}</span></span><span className="text-[10px] text-slate-500">{confidence(item.confidence)}</span></div><p className="mt-1 break-all font-mono text-[11px] text-slate-500">{item.file}</p><p className="mt-1 text-[11px] text-slate-500">{item.evidence.join(" · ")}{item.hasHandlers ? " · handlers detected" : ""}</p></li>)}</ul> : <p className="text-sm text-slate-500">No candidates detected.</p>}</div>;
              })}
            </div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Styling and design tokens</h3><div className="grid gap-4 sm:grid-cols-3"><div><p className="mb-2 text-xs font-medium text-slate-500">Styling systems</p><ReportList items={report.uiInventory.stylingSystems} empty="No styling system found." /></div><div><p className="mb-2 text-xs font-medium text-slate-500">Design tokens</p><ReportList items={report.uiInventory.designTokens} empty="No token files found." /></div><div><p className="mb-2 text-xs font-medium text-slate-500">Responsive indicators</p><ReportList items={report.uiInventory.responsiveIndicators} empty="No responsive indicators found." /></div></div></div>
          </div>}

          {tab === "File inventory" && report && <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-sm font-semibold text-slate-900">Files analyzed</h3><p className="mt-1 text-xs text-slate-500">{fileTotal.toLocaleString()} matching files · original source contents are not shown</p></div>
              <div className="flex gap-2">
                <input value={fileSearch} onChange={(event) => { setFileSearch(event.target.value); setFilePage(1); }} placeholder="Filter paths" aria-label="Filter file paths" className="h-9 min-w-0 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-slate-400" />
                <select value={fileCategory} onChange={(event) => { setFileCategory(event.target.value); setFilePage(1); }} aria-label="Filter file category" className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">All categories</option>{["source", "configuration", "test", "documentation", "asset", "other"].map((item) => <option key={item}>{item}</option>)}</select>
              </div>
            </div>
            {analysisFiles.length ? <div className="overflow-x-auto rounded-xl border border-slate-100"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 font-medium">Path</th><th className="px-3 py-2 font-medium">Category</th><th className="px-3 py-2 font-medium">Size</th><th className="px-3 py-2 font-medium">Parse status</th><th className="px-3 py-2 font-medium">SHA-256</th></tr></thead><tbody className="divide-y divide-slate-100">{analysisFiles.map((file) => <tr key={file.path}><td className="max-w-xs break-all px-3 py-2 font-mono text-slate-800">{file.path}</td><td className="px-3 py-2 capitalize text-slate-600">{file.category}</td><td className="px-3 py-2 tabular-nums text-slate-600">{file.size.toLocaleString()} B</td><td className="px-3 py-2 text-slate-600">{file.parseStatus.replaceAll("_", " ")}</td><td className="px-3 py-2 font-mono text-slate-500">{file.sha256.slice(0, 12)}…</td></tr>)}</tbody></table></div> : <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No inventory files match this filter.</p>}
            {filePages > 1 && <div className="flex items-center justify-end gap-2"><button type="button" disabled={filePage <= 1} onClick={() => setFilePage((page) => page - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Previous files"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs text-slate-500">Page {filePage} of {filePages}</span><button type="button" disabled={filePage >= filePages} onClick={() => setFilePage((page) => page + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Next files"><ChevronRight className="h-4 w-4" /></button></div>}
          </div>}

          {tab === "Dependencies" && report && <div className="grid gap-5 lg:grid-cols-2">
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Direct dependencies ({report.dependencies.direct.length})</h3><DependencyList items={report.dependencies.direct} empty="No supported direct dependency manifest found." /></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Development dependencies ({report.dependencies.development.length})</h3><DependencyList items={report.dependencies.development} empty="No development dependencies found." /></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Scripts and runtime</h3>{Object.keys(report.dependencies.scripts).length ? <ReportList items={Object.entries(report.dependencies.scripts).map(([name, command]) => name + ": " + command)} empty="" /> : <p className="text-sm text-slate-500">No package scripts were found.</p>}<div className="mt-4"><ReportList items={Object.entries(report.dependencies.declaredRuntime).map(([name, value]) => name + ": " + value)} empty="No runtime version was declared." /></div></div>
            <div className={panel}><h3 className="mb-3 text-sm font-semibold text-slate-900">Package manager and source imports</h3><p className="mb-1 text-sm text-slate-700">Package manager: {report.dependencies.packageManager || "Not detected"}</p><p className="mb-3 text-xs text-slate-500">Lockfile: {report.dependencies.lockfile || "Not detected"}</p><ReportList items={report.dependencies.observedImports} empty="No source imports were extracted." /></div>
            <p className="text-xs text-slate-500 lg:col-span-2">Declared dependencies are not necessarily used. Dependency vulnerability advisories were not queried, so no package is marked safe.</p>
          </div>}

          {tab === "Quality & security" && report && <div className="space-y-5">
            <div className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Static findings</h3><p className="mt-1 text-xs text-slate-500">{findingTotal} finding(s) · possible secrets are redacted</p></div><div className="flex gap-2"><select aria-label="Filter by severity" value={severity} onChange={(event) => { setSeverity(event.target.value); setFindingPage(1); }} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">All severity</option>{["critical", "high", "medium", "low", "info"].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by category" value={category} onChange={(event) => { setCategory(event.target.value); setFindingPage(1); }} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">All categories</option>{["security", "quality", "configuration", "dependency"].map((item) => <option key={item}>{item}</option>)}</select></div></div>
              {findings.length ? <ul className="mt-4 divide-y divide-slate-100">{findings.map((finding, index) => <li key={(finding.fileReference ?? "project") + finding.title + index} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">{finding.severity}</span><span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{finding.category}</span><span className="text-[10px] text-slate-400">{finding.evidenceType} · {confidence(finding.confidence)}</span></div><p className="mt-2 text-sm font-semibold text-slate-900">{finding.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{finding.description}</p>{finding.fileReference && <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{finding.fileReference}{finding.lineStart ? ":" + finding.lineStart : ""}</p>}{finding.remediation && <p className="mt-2 text-xs text-slate-600">Remediation: {finding.remediation}</p>}</li>)}</ul> : <div className="py-8 text-center text-sm text-slate-500">{findingTotal ? "No findings match this filter." : "No findings were recorded by the configured checks."}</div>}
              {findingPages > 1 && <div className="mt-4 flex items-center justify-end gap-2"><button type="button" disabled={findingPage <= 1} onClick={() => setFindingPage((page) => page - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Previous findings"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs text-slate-500">Page {findingPage} of {findingPages}</span><button type="button" disabled={findingPage >= findingPages} onClick={() => setFindingPage((page) => page + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Next findings"><ChevronRight className="h-4 w-4" /></button></div>}
            </div>
            <div className="grid gap-5 lg:grid-cols-2"><Checklist title="Checks completed" items={report.quality.checksCompleted} /><Checklist title="Not configured or skipped" items={report.quality.checksSkipped} /></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="text-sm font-semibold text-amber-950">Static analysis limitations</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">{report.quality.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>}

          {tab === "History" && <div className="space-y-2">{jobs.length ? jobs.map((item) => <button key={item.id} type="button" onClick={() => void chooseHistory(item)} className={"flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition sm:flex-row sm:items-center sm:justify-between " + (job.id === item.id ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:bg-slate-50")}><span><span className="font-semibold text-slate-900">Analysis v{item.analysisVersion}</span><span className="ml-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></span><span className="flex items-center gap-2"><span className={"rounded-full px-2 py-1 text-[10px] font-semibold uppercase " + statusStyle(item.status)}>{item.status}</span><span className="text-xs tabular-nums text-slate-500">{item.progress}%</span>{item.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</span></button>) : <div className="py-12 text-center"><p className="text-sm font-medium text-slate-800">No analysis history yet</p><p className="mt-1 text-xs text-slate-500">Start analysis to create the first versioned project report.</p></div>}</div>}
        </div>
      </div>}
    </section>
  );
}

function DependencyList({ items, empty }: { items: Report["dependencies"]["direct"]; empty: string }) {
  return items.length ? <ul className="max-h-80 space-y-2 overflow-auto">{items.slice(0, 500).map((item) => <li key={item.source + item.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="min-w-0 truncate text-xs font-medium text-slate-800">{item.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-500">{item.version}</span></li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>;
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>{items.length ? <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />{item}</li>)}</ul> : <p className="text-sm text-slate-500">None.</p>}</div>;
}
