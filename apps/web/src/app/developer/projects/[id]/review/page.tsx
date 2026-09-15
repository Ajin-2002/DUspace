"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { StepWizard, PIPELINE_STEPS } from "@/components/developer/step-wizard";
import { ProjectTypeSelector, ProjectType } from "@/components/developer/project-type-selector";
import { TagInput } from "@/components/developer/tag-input";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Productivity", "Design", "Development", "Marketing",
  "Education", "Utilities", "Entertainment", "Business",
  "Communication", "Security", "Finance", "Health", "Other",
];

const LICENSES = [
  "MIT", "Apache 2.0", "GPL v2", "GPL v3", "LGPL v2.1", "LGPL v3",
  "BSD 2-Clause", "BSD 3-Clause", "MPL 2.0", "AGPL v3",
  "ISC", "CC0 1.0", "Proprietary", "Other",
];

const LANGUAGE_SUGGESTIONS = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "C++", "C",
  "Swift", "Kotlin", "Ruby", "PHP", "Dart", "Elixir", "Scala", "R", "Shell",
];

const FRAMEWORK_SUGGESTIONS = [
  "Next.js", "React", "Vue.js", "Angular", "Svelte", "Nuxt.js", "Remix",
  "Express", "FastAPI", "Django", "Flask", "Spring Boot", "NestJS", "Laravel",
  "Rails", "Flutter", "React Native", "Expo", "Electron", "Tauri",
];

/** Badge shown next to AI-suggested fields */
function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
      <Sparkles className="h-2.5 w-2.5" />
      AI suggested
    </span>
  );
}

/** Field wrapper that shows the AI badge when a value came from AI */
function FieldRow({
  label, required, aiSuggested, children, hint,
}: {
  label: string;
  required?: boolean;
  aiSuggested?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {aiSuggested && <AIBadge />}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>}
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  // Track which fields were AI-suggested
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName]                         = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription]           = useState("");
  const [projectType, setProjectType]           = useState<ProjectType>("web-app");
  const [category, setCategory]                 = useState("Utilities");
  const [license, setLicense]                   = useState("MIT");
  const [tags, setTags]                         = useState<string[]>([]);
  const [languages, setLanguages]               = useState<string[]>([]);
  const [frameworks, setFrameworks]             = useState<string[]>([]);
  const [repositoryUrl, setRepositoryUrl]       = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [websiteUrl, setWebsiteUrl]             = useState("");

  const [isLoading, setIsLoading]               = useState(true);
  const [isSaving, setIsSaving]                 = useState(false);
  const [error, setError]                       = useState("");

  const authHeaders = { Authorization: `Bearer ${session?.user?.token}` };

  useEffect(() => {
    if (!session?.user?.token) return;
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadSuggestions = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}`), { headers: authHeaders });
      if (!res.ok) return;
      const { app } = await res.json();

      // Prefer aiSuggestions if they exist, otherwise fall back to app fields
      const s = app.aiSuggestions || app;
      const detected = new Set<string>();

      const applyIfPresent = (
        val: string | undefined,
        setter: (v: string) => void,
        key: string
      ) => {
        if (val && val !== "Untitled Project" && val !== "") {
          setter(val);
          detected.add(key);
        }
      };

      const applyArrIfPresent = (
        val: string[] | undefined,
        setter: (v: string[]) => void,
        key: string
      ) => {
        if (val && val.length > 0) {
          setter(val);
          detected.add(key);
        }
      };

      applyIfPresent(s.name || app.name, setName, "name");
      applyIfPresent(s.shortDescription || s.summary || app.shortDescription, setShortDescription, "shortDescription");
      applyIfPresent(s.description || app.description, setDescription, "description");

      if (s.projectType && s.projectType !== "web-app") {
        setProjectType(s.projectType as ProjectType);
        detected.add("projectType");
      } else if (app.projectType) {
        setProjectType(app.projectType as ProjectType);
      }

      applyIfPresent(s.category || app.category, setCategory, "category");
      applyIfPresent(s.license || app.license, setLicense, "license");
      applyArrIfPresent(s.tags || app.tags, setTags, "tags");
      applyArrIfPresent(s.languages || app.languages, setLanguages, "languages");
      applyArrIfPresent(s.frameworks || app.frameworks, setFrameworks, "frameworks");
      applyIfPresent(s.repositoryUrl || app.repositoryUrl, setRepositoryUrl, "repositoryUrl");
      applyIfPresent(s.documentationUrl || app.documentationUrl, setDocumentationUrl, "documentationUrl");
      applyIfPresent(s.websiteUrl || app.websiteUrl, setWebsiteUrl, "websiteUrl");

      setAiFields(detected);
    } catch {
      // silently fail — user fills manually
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    if (!name.trim()) { setError("Project name is required"); return; }
    if (!shortDescription.trim()) { setError("Short description is required"); return; }

    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: name.trim(),
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          projectType,
          category,
          license,
          tags,
          languages,
          frameworks,
          repositoryUrl: repositoryUrl.trim(),
          documentationUrl: documentationUrl.trim(),
          websiteUrl: websiteUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/developer/projects/${id}/configure`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 transition";
  const selectCls = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-neutral-900 focus:outline-none transition";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  const hasAiData = aiFields.size > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Review AI Suggestions</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {hasAiData
            ? "We've auto-filled the fields below based on your project. Review and edit anything before confirming."
            : "Fill in the details below to describe your project."}
        </p>
      </div>

      <StepWizard steps={PIPELINE_STEPS} currentStep="review" completedSteps={["import", "analyze"]} />

      {/* AI callout */}
      {hasAiData && (
        <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-violet-500" />
          <div>
            <p className="text-sm font-semibold text-violet-900">
              AI auto-filled {aiFields.size} field{aiFields.size !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-violet-700">
              Fields marked with <span className="font-semibold">✨ AI suggested</span> were detected automatically.
              All fields are editable — review carefully before confirming.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* ── Basic Information ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-neutral-900">Basic information</h2>

            <FieldRow label="Project name" required aiSuggested={aiFields.has("name")}
              hint={`${name.length}/80 characters`}>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                maxLength={80}
                className={inputCls}
              />
            </FieldRow>

            <FieldRow label="Short description" required aiSuggested={aiFields.has("shortDescription")}
              hint={`${shortDescription.length}/140 characters · Shown in search results`}>
              <input
                id="project-short-desc"
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A one-line summary of your project"
                maxLength={140}
                className={inputCls}
              />
            </FieldRow>

            <FieldRow label="Detailed description" aiSuggested={aiFields.has("description")}>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project in detail — features, use cases, and what makes it unique…"
                rows={5}
                className={cn(inputCls, "resize-none")}
              />
            </FieldRow>
          </div>

          {/* ── Project Type ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">Project type</h2>
              {aiFields.has("projectType") && <AIBadge />}
            </div>
            <ProjectTypeSelector value={projectType} onChange={setProjectType} />
          </div>

          {/* ── Classification ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-neutral-900">Classification</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Category" aiSuggested={aiFields.has("category")}>
                <select id="project-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </FieldRow>

              <FieldRow label="License" aiSuggested={aiFields.has("license")}>
                <select id="project-license" value={license} onChange={(e) => setLicense(e.target.value)} className={selectCls}>
                  {LICENSES.map((lic) => <option key={lic} value={lic}>{lic}</option>)}
                </select>
              </FieldRow>
            </div>

            <FieldRow label="Tags" aiSuggested={aiFields.has("tags")}>
              <TagInput value={tags} onChange={setTags} placeholder="Add tags…" maxTags={10} />
            </FieldRow>

            <FieldRow label="Programming languages" aiSuggested={aiFields.has("languages")}>
              <TagInput value={languages} onChange={setLanguages} placeholder="TypeScript, Python…" suggestions={LANGUAGE_SUGGESTIONS} maxTags={8} />
            </FieldRow>

            <FieldRow label="Frameworks & technologies" aiSuggested={aiFields.has("frameworks")}>
              <TagInput value={frameworks} onChange={setFrameworks} placeholder="Next.js, FastAPI…" suggestions={FRAMEWORK_SUGGESTIONS} maxTags={8} />
            </FieldRow>
          </div>

          {/* ── Links ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Links</h2>

            {[
              { id: "repo-url",  label: "Repository URL",     aiKey: "repositoryUrl",    value: repositoryUrl,    setter: setRepositoryUrl,    placeholder: "https://github.com/user/repo" },
              { id: "docs-url",  label: "Documentation URL",  aiKey: "documentationUrl", value: documentationUrl, setter: setDocumentationUrl, placeholder: "https://docs.example.com" },
              { id: "site-url",  label: "Website / Demo URL", aiKey: "websiteUrl",       value: websiteUrl,       setter: setWebsiteUrl,       placeholder: "https://example.com" },
            ].map((field) => (
              <FieldRow key={field.id} label={field.label} aiSuggested={aiFields.has(field.aiKey)}>
                <input
                  id={field.id}
                  type="url"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className={inputCls}
                />
              </FieldRow>
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Summary</h3>
            <dl className="space-y-3">
              {[
                { label: "Name",     value: name || "—" },
                { label: "Type",     value: projectType.replace(/-/g, " ") },
                { label: "Category", value: category },
                { label: "License",  value: license },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-neutral-900 capitalize">{value}</dd>
                </div>
              ))}
              {languages.length > 0 && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Languages</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {languages.map((l) => (
                      <span key={l} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">{l}</span>
                    ))}
                  </dd>
                </div>
              )}
              {frameworks.length > 0 && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Frameworks</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {frameworks.map((f) => (
                      <span key={f} className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-purple-100">{f}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            id="confirm-review-btn"
            onClick={handleConfirm}
            disabled={isSaving || !name.trim() || !shortDescription.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <>Confirm & Configure <ArrowRight className="h-4 w-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-neutral-400">
            You can edit all details later in project settings.
          </p>
        </div>
      </div>
    </div>
  );
}
