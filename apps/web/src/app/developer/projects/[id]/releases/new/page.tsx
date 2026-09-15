"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Loader2, Tag, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { ReleaseChannelBadge, ReleaseChannel } from "@/components/developer/release-channel-badge";
import { StepWizard, PIPELINE_STEPS } from "@/components/developer/step-wizard";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";


const CHANNELS: { value: ReleaseChannel; label: string; description: string }[] = [
  { value: "stable", label: "Stable",  description: "Production-ready release for all users" },
  { value: "beta",   label: "Beta",    description: "Feature-complete but may have minor issues" },
  { value: "alpha",  label: "Alpha",   description: "Early preview, expect breaking changes" },
];

function bumpVersion(version: string, type: "patch" | "minor" | "major"): string {
  const parts = version.split(".").map(Number);
  if (parts.length < 3) return version;
  if (type === "patch") return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  if (type === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0] + 1}.0.0`;
}

export default function NewReleasePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [version, setVersion] = useState("1.0.0");
  const [title, setTitle] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [changelog, setChangelog] = useState("");
  const [channel, setChannel] = useState<ReleaseChannel>("stable");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const addScreenshot = () => {
    const url = newScreenshotUrl.trim();
    if (url && !screenshotUrls.includes(url)) {
      setScreenshotUrls([...screenshotUrls, url]);
      setNewScreenshotUrl("");
    }
  };

  const handleCreate = async (publish = false) => {
    if (!version.trim()) { setError("Version is required"); return; }
    setIsSaving(true);
    setError("");
    try {
      // 1. Create the release
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/releases`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({ version: version.trim(), title, releaseNotes, changelog, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create release");

      const releaseId = data.release._id;

      // 2. Update screenshots
      if (screenshotUrls.length > 0) {
        await fetch(getApiUrl(`/api/developer/apps/${id}/releases/${releaseId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.token}` },
          body: JSON.stringify({ screenshots: screenshotUrls }),
        });
      }

      if (publish) {
        router.push(`/developer/projects/${id}/releases/${releaseId}/publish`);
      } else {
        router.push(`/developer/projects/${id}/releases`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/developer/projects/${id}/releases`} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create release</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Package a version of your project for distribution.</p>
        </div>
      </div>

      <StepWizard steps={PIPELINE_STEPS} currentStep="release" completedSteps={["import", "analyze", "review", "configure"]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Version */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-neutral-900">Version</h2>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-neutral-400">v</span>
                <input
                  id="release-version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full rounded-xl border border-neutral-200 pl-8 pr-4 py-2.5 font-mono text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                {(["major", "minor", "patch"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVersion(bumpVersion(version, type))}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition capitalize"
                  >
                    +{type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Release title <span className="text-neutral-400">(optional)</span></label>
              <input
                id="release-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 'Dark mode & performance improvements'"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Channel */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Release channel</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    channel === ch.value
                      ? "border-neutral-900 bg-neutral-900"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  <ReleaseChannelBadge channel={ch.value} className="mb-2" />
                  <p className={cn("text-xs mt-1", channel === ch.value ? "text-white/70" : "text-neutral-500")}>
                    {ch.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Release notes */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-neutral-900">Release notes</h2>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">What's new in this release?</label>
              <textarea
                id="release-notes"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Describe the features, fixes, and improvements in this release…"
                rows={5}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Changelog <span className="text-neutral-400">(optional)</span></label>
              <textarea
                id="release-changelog"
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="- Added dark mode&#10;- Fixed login bug&#10;- Improved performance"
                rows={4}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Screenshots */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-neutral-500" />
              <h2 className="text-base font-semibold text-neutral-900">Screenshots</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={newScreenshotUrl}
                onChange={(e) => setNewScreenshotUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addScreenshot()}
                placeholder="https://example.com/screenshot.png"
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
              <button onClick={addScreenshot} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition">
                Add
              </button>
            </div>
            {screenshotUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {screenshotUrls.map((url, i) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => setScreenshotUrls(screenshotUrls.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Release summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Version</dt><dd className="font-mono font-bold text-neutral-900">v{version || "—"}</dd></div>
              <div className="flex justify-between items-center"><dt className="text-neutral-500">Channel</dt><dd><ReleaseChannelBadge channel={channel} size="sm" /></dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Screenshots</dt><dd className="font-medium text-neutral-900">{screenshotUrls.length}</dd></div>
            </dl>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            id="create-release-publish-btn"
            onClick={() => handleCreate(true)}
            disabled={isSaving || !version.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Save & Publish
          </button>

          <button
            id="create-release-draft-btn"
            onClick={() => handleCreate(false)}
            disabled={isSaving || !version.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition"
          >
            Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}
