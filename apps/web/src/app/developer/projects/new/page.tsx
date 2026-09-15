"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload, GitBranch, Package, ArrowRight, Loader2, Image as ImageIcon, X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

type Source = "zip" | "github" | "git" | "npm" | "pypi";

const SOURCES: { id: Source; label: string; description: string; icon: React.ElementType; gradient: string }[] = [
  {
    id: "zip",
    label: "Upload ZIP",
    description: "Upload your project as a ZIP archive from your computer",
    icon: Upload,
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    id: "github",
    label: "GitHub",
    description: "Import directly from a GitHub repository URL",
    icon: Github,
    gradient: "from-neutral-700 to-neutral-900",
  },
  {
    id: "git",
    label: "Git Repository",
    description: "Clone any public or private Git repository",
    icon: GitBranch,
    gradient: "from-orange-500 to-amber-400",
  },
  {
    id: "npm",
    label: "npm Package",
    description: "Import from a published npm package name or URL",
    icon: Package,
    gradient: "from-red-500 to-rose-400",
  },
  {
    id: "pypi",
    label: "PyPI Package",
    description: "Import from a published Python package on PyPI",
    icon: Package,
    gradient: "from-yellow-500 to-amber-400",
  },
];

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [selected, setSelected] = useState<Source>("zip");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Choose a JPEG, PNG, GIF, or WebP image smaller than 10 MB.");
      return;
    }
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleContinue = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/developer/apps"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          // Minimal placeholder — all real fields are filled in the Review step
          name: "Untitled Project",
          shortDescription: "",
          importSource: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      if (coverImage) {
        const formData = new FormData();
        formData.append("cover", coverImage);
        const coverRes = await fetch(getApiUrl(`/api/developer/apps/${data.app._id}/cover`), {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.user?.token}` },
          body: formData,
        });
        if (!coverRes.ok) throw new Error("Failed to upload cover image");
      }
      router.push(`/developer/projects/${data.app._id}/import?source=${selected}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Create new project
        </h1>
        <p className="text-sm text-neutral-500">
          Choose how to bring your project into DUspace. AI will analyse it and auto-fill all the details for you.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                <button type="button" onClick={() => { setCoverImage(null); setCoverPreview(""); }} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-neutral-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : <ImageIcon className="h-7 w-7 text-neutral-300" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Project cover image</p>
            <p className="mt-1 text-xs text-neutral-500">Shown on Featured and New Releases cards. Up to 10 MB.</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
              <ImageIcon className="h-4 w-4" /> Choose image
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Source cards */}
      <div className="space-y-3">
        {SOURCES.map((src) => {
          const isSelected = selected === src.id;
          return (
            <button
              key={src.id}
              type="button"
              onClick={() => setSelected(src.id)}
              className={cn(
                "group w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-neutral-900 bg-neutral-900 shadow-lg"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  isSelected
                    ? "bg-white/15"
                    : `bg-gradient-to-br ${src.gradient} text-white`
                )}
              >
                <src.icon className="h-5 w-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", isSelected ? "text-white" : "text-neutral-900")}>
                  {src.label}
                </p>
                <p className={cn("mt-0.5 text-xs", isSelected ? "text-white/70" : "text-neutral-500")}>
                  {src.description}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={cn(
                  "h-4 w-4 shrink-0 rounded-full border-2 transition",
                  isSelected
                    ? "border-white bg-white"
                    : "border-neutral-300 bg-white group-hover:border-neutral-400"
                )}
              >
                {isSelected && (
                  <div className="m-0.5 h-2 w-2 rounded-full bg-neutral-900" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* AI info callout */}
      <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
        <span className="text-lg">✨</span>
        <div>
          <p className="text-sm font-semibold text-violet-900">AI-powered auto-fill</p>
          <p className="mt-0.5 text-xs text-violet-700">
            After you upload or link your project, our AI will inspect it and automatically suggest the project name,
            description, type, category, tags, technologies, and links — all editable before you confirm.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/developer/projects"
          className="flex items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          Cancel
        </Link>
        <button
          id="continue-btn"
          onClick={handleContinue}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
          ) : (
            <>Continue <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
