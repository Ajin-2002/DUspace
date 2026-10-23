"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Heart, Loader2, Monitor, Search, Smartphone, Tablet, X } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { PreviewIcon, TemplatePreview, type PreviewMode } from "@/components/design-library/template-preview";
import type { DesignAccent, DesignDensity } from "@duspace/design-system";

type TemplateCategory = "dashboard" | "navigation" | "component" | "forms" | "settings" | "dialogs" | "profile" | "landing";
type CompatibilityLevel = "full" | "partial" | "unsupported";
type DesignTarget = "page" | "navigation" | "component" | "form" | "dialog";
type Template = {
  id: string; slug: string; name: string; description: string; category: TemplateCategory; version: number;
  frameworks: string[]; stylingSystems: string[]; supportedComponentTypes: DesignTarget[];
  requiredDependencies: string[]; responsive: boolean; accessibility: string[]; tags: string[];
  compatibility: { level: CompatibilityLevel; framework: string | null; stylingSystem: string | null; reasons: string[] };
};
type Project = { id: string; name: string; status: string; framework?: string };
type SavedSelection = { id: string; templateId: string; templateVersion: number; targetComponentType: DesignTarget; configuration: { accent?: DesignAccent; density?: DesignDensity }; updatedAt?: string };

const categories: Array<[string, string]> = [["", "All categories"], ["dashboard", "Dashboards"], ["navigation", "Navigation"], ["component", "Components"], ["forms", "Forms"], ["settings", "Settings"], ["dialogs", "Dialogs"], ["profile", "Profile"], ["landing", "Landing sections"]];
const compatibilityLabels: Record<CompatibilityLevel, string> = { full: "Fully supported", partial: "Partially supported", unsupported: "Unsupported" };

function compatibilityColor(level: CompatibilityLevel): string {
  if (level === "full") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (level === "unsupported") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function readFavorites(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem("duspace.design-library.favorites.v1") ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}

export default function DesignLibraryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const token = session?.user?.token;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [selections, setSelections] = useState<SavedSelection[]>([]);
  const [selectionsProjectId, setSelectionsProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [framework, setFramework] = useState("");
  const [stylingSystem, setStylingSystem] = useState("");
  const [compatibility, setCompatibility] = useState<"all" | CompatibilityLevel>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [accent, setAccent] = useState<DesignAccent>("graphite");
  const [density, setDensity] = useState<DesignDensity>("comfortable");
  const [projectAnalyzed, setProjectAnalyzed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFavorites(readFavorites());
      setFavoritesReady(true);
      const requestedProject = new URLSearchParams(window.location.search).get("projectId");
      if (requestedProject) setProjectId(requestedProject);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (favoritesReady) window.localStorage.setItem("duspace.design-library.favorites.v1", JSON.stringify(favorites));
  }, [favorites, favoritesReady]);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!token) throw new Error("Sign in as a developer to use the Design Library.");
    const response = await fetch(getApiUrl(path), {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The Design Library request could not be completed.");
    return data;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void request("/api/v1/projects?status=ready&limit=100").then((data) => {
        if (!cancelled) setProjects((data.projects ?? []).filter((item: Project) => item.status === "ready"));
      }).catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Projects could not be loaded.");
      }).finally(() => { if (!cancelled) setProjectsLoading(false); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [request, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (search.trim()) params.set("q", search.trim());
      if (category) params.set("category", category);
      if (framework) params.set("framework", framework);
      if (stylingSystem) params.set("stylingSystem", stylingSystem);
      void request(`/api/v1/design-library/templates${params.size ? `?${params}` : ""}`).then((data) => {
        if (!cancelled) {
          setTemplates(data.templates ?? []);
          setProjectAnalyzed(Boolean(data.projectAnalyzed));
        }
      }).catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Design templates could not be loaded.");
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [category, framework, projectId, request, search, stylingSystem, token]);

  useEffect(() => {
    if (!token || !projectId) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void request(`/api/v1/design-library/projects/${projectId}/selections`).then((data) => {
        if (!cancelled) {
          setSelections(data.selections ?? []);
          setSelectionsProjectId(projectId);
        }
      }).catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Saved designs could not be loaded.");
      });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [projectId, request, token]);

  useEffect(() => {
    if (!previewTemplate) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewTemplate(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewTemplate]);

  const activeSelections = selectionsProjectId === projectId ? selections : [];
  const visibleTemplates = useMemo(() => templates.filter((item) =>
    (compatibility === "all" || item.compatibility.level === compatibility) && (!showFavorites || favorites.includes(item.id))),
  [compatibility, favorites, showFavorites, templates]);

  const chosenProject = projects.find((item) => item.id === projectId);
  const frameworks = useMemo(() => [...new Set(templates.flatMap((item) => item.frameworks))].sort(), [templates]);
  const stylingSystems = useMemo(() => [...new Set(templates.flatMap((item) => item.stylingSystems))].sort(), [templates]);

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function openPreview(item: Template) {
    setPreviewTemplate(item);
    setAccent("graphite");
    setDensity("comfortable");
    setPreviewMode("desktop");
    setNotice("");
  }

  async function openSavedSelection(selection: SavedSelection) {
    let item = templates.find((template) => template.id === selection.templateId);
    if (!item) {
      try {
        const params = new URLSearchParams();
        if (projectId) params.set("projectId", projectId);
        const data = await request(`/api/v1/design-library/templates/${selection.templateId}${params.size ? `?${params}` : ""}`);
        item = data.template as Template;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "The saved design could not be opened.");
        return;
      }
    }
    setPreviewTemplate(item);
    setAccent(selection.configuration.accent ?? "graphite");
    setDensity(selection.configuration.density ?? "comfortable");
    setPreviewMode("desktop");
    setNotice("");
  }

  async function saveSelection() {
    if (!previewTemplate || !projectId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const targetComponentType = previewTemplate.supportedComponentTypes[0];
      const data = await request(`/api/v1/design-library/projects/${projectId}/selections`, {
        method: "PUT",
        body: JSON.stringify({ templateId: previewTemplate.id, templateVersion: previewTemplate.version, targetComponentType, configuration: { accent, density } }),
      });
      setSelections((current) => [data.selection, ...(selectionsProjectId === projectId ? current.filter((item) => !(item.templateId === data.selection.templateId && item.targetComponentType === targetComponentType)) : [])]);
      setSelectionsProjectId(projectId);
      setNotice("Design intent saved to this project. Its source files are unchanged.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The design selection could not be saved.");
    } finally { setSaving(false); }
  }

  function selectProject(value: string) {
    setProjectId(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("projectId", value); else url.searchParams.delete("projectId");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }

  if (sessionStatus === "loading" || projectsLoading && Boolean(token)) return <main className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" aria-label="Loading Design Library" /></main>;
  if (!token) return <main className="mx-auto max-w-2xl px-4 py-12"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-lg font-semibold text-slate-950">Sign in to open the Design Library</h1><p className="mt-2 text-sm text-slate-600">The reusable previews and templates are available to developer accounts.</p><Link href="/login" className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign in</Link></div></main>;

  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Creator tools · design library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A considered starting point.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Browse reusable interface patterns, check them against your analyzed project, and save a design direction before any source changes.</p></div>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-600 sm:min-w-72"><span>Save design intent to a workspace</span><span className="relative"><span className="sr-only">Choose project workspace</span><FolderIcon /><select value={projectId} onChange={(event) => selectProject(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"><option value="">Preview without a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}{item.framework ? ` · ${item.framework}` : ""}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span></label>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-xs text-slate-600">{chosenProject ? <><strong className="font-semibold text-slate-900">{chosenProject.name}</strong>{projectAnalyzed ? " · compatibility uses its latest blueprint" : " · analyze it to get project-specific compatibility"}</> : "Choose a workspace to see compatibility and save a selection."}</p>
        {chosenProject && <Link href={`/developer/workspaces/${chosenProject.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950">Open workspace <ArrowRight className="h-3.5 w-3.5" /></Link>}
      </div>
    </header>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}<button type="button" onClick={() => setError("")} className="ml-auto rounded p-1 hover:bg-rose-100" aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="h-4 w-4" />{notice}</div>}

    {activeSelections.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Saved design intentions</h2><p className="mt-0.5 text-xs text-slate-500">Recorded for this workspace; project files are not modified.</p></div><div className="flex flex-wrap gap-2">{activeSelections.map((item) => <button key={item.id} type="button" onClick={() => openSavedSelection(item)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">{item.templateId.replaceAll("-", " ")} · v{item.templateVersion}</button>)}</div></div></section>}

    <section className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Browse templates</h2><p className="mt-1 text-sm text-slate-500">{visibleTemplates.length} reusable patterns · illustrative preview data only</p></div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <label className="relative sm:col-span-2 xl:w-64"><span className="sr-only">Search templates</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>
          <FilterSelect label="Category" value={category} onChange={setCategory} options={categories} />
          <FilterSelect label="Framework" value={framework} onChange={setFramework} options={[["", "Any framework"], ...frameworks.map((item) => [item, item] as [string, string])]} />
          <FilterSelect label="Styling" value={stylingSystem} onChange={setStylingSystem} options={[["", "Any styling"], ...stylingSystems.map((item) => [item, item] as [string, string])]} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500">Compatibility</span>
        {(["all", "full", "partial", "unsupported"] as const).map((value) => <button key={value} type="button" onClick={() => setCompatibility(value)} aria-pressed={compatibility === value} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${compatibility === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{value === "all" ? "All" : compatibilityLabels[value]}</button>)}
        <button type="button" onClick={() => setShowFavorites((value) => !value)} aria-pressed={showFavorites} className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${showFavorites ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><Heart className={`h-3.5 w-3.5 ${showFavorites ? "fill-current" : ""}`} /> Favorites {favorites.length > 0 && <span>({favorites.length})</span>}</button>
      </div>

      {loading ? <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /><span className="ml-2 text-sm text-slate-500">Loading templates…</span></div> : visibleTemplates.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><Search className="mx-auto h-6 w-6 text-slate-400" /><h3 className="mt-3 text-sm font-semibold text-slate-900">No templates match these filters</h3><p className="mt-1 text-xs text-slate-500">Try a different search or category, or clear the favorites filter.</p><button type="button" onClick={() => { setSearch(""); setCategory(""); setFramework(""); setStylingSystem(""); setCompatibility("all"); setShowFavorites(false); }} className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleTemplates.map((item) => <TemplateCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onPreview={() => openPreview(item)} onSelect={() => openPreview(item)} selected={activeSelections.some((saved) => saved.templateId === item.id)} />)}</div>}
    </section>

    {previewTemplate && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewTemplate(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="preview-title" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800"><PreviewIcon templateId={previewTemplate.id} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 id="preview-title" className="text-lg font-semibold text-slate-950">{previewTemplate.name}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">v{previewTemplate.version}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{previewTemplate.description}</p></div></div><button type="button" onClick={() => setPreviewTemplate(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close preview"><X className="h-4 w-4" /></button></header>
        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">{(["desktop", "tablet", "mobile"] as PreviewMode[]).map((mode) => { const Icon = mode === "desktop" ? Monitor : mode === "tablet" ? Tablet : Smartphone; return <button key={mode} type="button" onClick={() => setPreviewMode(mode)} aria-label={`${mode} preview`} aria-pressed={previewMode === mode} className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold capitalize ${previewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{mode}</span></button>; })}</div><span className="text-[10px] text-slate-500">Sample content is illustrative</span></div><TemplatePreview templateId={previewTemplate.id} mode={previewMode} accent={accent} density={density} /></div>
          <aside className="space-y-5 border-t border-slate-100 bg-slate-50/70 p-5 lg:border-l lg:border-t-0 sm:p-6"><div><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project compatibility</h3><div className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${compatibilityColor(previewTemplate.compatibility.level)}`}>{compatibilityLabels[previewTemplate.compatibility.level]}</div><p className="mt-2 text-xs leading-5 text-slate-600">{previewTemplate.compatibility.reasons.join(" ")}</p></div>
            <div><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supports</h3><div className="mt-2 flex flex-wrap gap-1.5">{previewTemplate.frameworks.map((item) => <span key={item} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600">{item}</span>)}</div><div className="mt-1.5 flex flex-wrap gap-1.5">{previewTemplate.stylingSystems.map((item) => <span key={item} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600">{item}</span>)}</div></div>
            <div><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview settings</h3><label className="mt-2 block text-[11px] font-medium text-slate-600">Accent<select value={accent} onChange={(event) => setAccent(event.target.value as DesignAccent)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400"><option value="graphite">Graphite</option><option value="blue">Blue</option><option value="violet">Violet</option></select></label><label className="mt-2 block text-[11px] font-medium text-slate-600">Spacing<select value={density} onChange={(event) => setDensity(event.target.value as DesignDensity)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>
            <div><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</h3><p className="mt-2 text-xs text-slate-600">{previewTemplate.requiredDependencies.join(" · ")}</p><p className="mt-2 text-[10px] leading-4 text-slate-500">Responsive layout · keyboard reachable controls · visible focus states</p></div>
            {error && <p role="alert" className="text-xs leading-5 text-rose-700">{error}</p>}
            {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{notice}</p>}
            <button type="button" onClick={() => void saveSelection()} disabled={!projectId || saving || previewTemplate.compatibility.level === "unsupported"} title={!projectId ? "Choose a workspace above first" : previewTemplate.compatibility.level === "unsupported" ? "This template is unsupported by the analyzed project" : undefined} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{activeSelections.some((item) => item.templateId === previewTemplate.id) ? "Update selection" : "Save design intent"}</button>
            <p className="text-center text-[10px] leading-4 text-slate-500">This records the template ID, version and configuration for {chosenProject?.name || "a selected workspace"}. It does not apply code changes.</p>
          </aside>
        </div>
      </section>
    </div>}
  </main>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="relative"><span className="sr-only">Filter by {label.toLowerCase()}</span><select aria-label={`Filter by ${label}`} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-slate-400 xl:min-w-32">{options.map(([optionValue, optionLabel]) => <option key={optionValue || "all"} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /></label>;
}

function TemplateCard({ item, favorite, selected, onFavorite, onPreview, onSelect }: { item: Template; favorite: boolean; selected: boolean; onFavorite: () => void; onPreview: () => void; onSelect: () => void }) {
  const categoryLabel = categories.find(([value]) => value === item.category)?.[1] ?? item.category;
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
    <div className="relative border-b border-slate-100 bg-slate-50 p-3"><div className="pointer-events-none"><TemplatePreview templateId={item.id} mode="desktop" /></div><span className={`absolute left-5 top-5 rounded-full border px-2 py-1 text-[9px] font-semibold ${compatibilityColor(item.compatibility.level)}`}>{compatibilityLabels[item.compatibility.level]}</span><button type="button" onClick={onFavorite} aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`} aria-pressed={favorite} className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${favorite ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white/95 text-slate-500 hover:text-rose-600"}`}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button></div>
    <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{categoryLabel}</p><h3 className="mt-1 text-sm font-semibold text-slate-950">{item.name}</h3></div><span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">v{item.version}</span></div><p className="min-h-10 text-xs leading-5 text-slate-600">{item.description}</p><div className="flex min-h-5 flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-slate-50 px-2 py-1 text-[9px] text-slate-500">{tag}</span>)}</div><p className="text-[10px] leading-4 text-slate-500">{item.compatibility.reasons[0]}</p><div className="flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={onPreview} className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Preview</button><button type="button" onClick={onSelect} disabled={item.compatibility.level === "unsupported"} className="h-9 flex-1 rounded-lg bg-slate-950 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{selected ? "Review selection" : "Select"}</button></div></div>
  </article>;
}

function FolderIcon() { return <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded border border-slate-400"><span className="absolute -top-1 left-0 h-1 w-1.5 rounded-t border border-b-0 border-slate-400 bg-white" /></span>; }
