"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/ui/file-upload";
import { getApiUrl } from "@/lib/api";

const CATEGORIES = [
  "Productivity",
  "Design",
  "Development",
  "Marketing",
  "Education",
  "Utilities",
  "Entertainment",
  "Business",
  "Communication",
  "Other",
];

export default function SubmitAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [version, setVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<"info" | "files" | "review">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  if (!session?.user?.isDeveloper) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            You must be a registered developer to submit apps. Visit the developer space to upgrade your account.
          </p>
        </div>
      </div>
    );
  }

  const createAppEntry = async () => {
    setError("");
    setIsLoading(true);

    try {
      const appRes = await fetch(getApiUrl("/api/developer/apps"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          name: appName,
          description,
          category,
          version,
        }),
      });

      if (!appRes.ok) {
        const data = await appRes.json();
        throw new Error(data.error || "Failed to create app");
      }

      const { app } = await appRes.json();
      setCreatedAppId(app._id);
      return app._id as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToFiles = async () => {
    if (!appName.trim()) return;

    const appId = createdAppId || (await createAppEntry());
    if (appId) {
      setStep("files");
    }
  };

  const handleSubmitApp = async () => {
    const appId = createdAppId || (await createAppEntry());
    if (!appId) return;

    setIsLoading(true);

    try {
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const uploadRes = await fetch(getApiUrl(`/api/developer/apps/${appId}/upload`), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.user?.token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Failed to upload files");
        }
      }

      if (coverImage) {
        const coverData = new FormData();
        coverData.append("cover", coverImage);
        const coverRes = await fetch(getApiUrl(`/api/developer/apps/${appId}/cover`), {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.user?.token}` },
          body: coverData,
        });
        if (!coverRes.ok) throw new Error("Failed to upload cover image");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/developer/apps");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white border border-neutral-200 p-8 text-center max-w-sm">
          <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">App Submitted!</h3>
          <p className="text-sm text-neutral-600">
            Your app has been created successfully. Redirecting to your apps...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/developer/apps"
          className="rounded-lg hover:bg-neutral-100 p-2"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Submit New App</h1>
          <p className="text-sm text-neutral-500">
            Share your application with our community
          </p>
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cover Image</label>
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => { setCoverImage(null); setCoverPreview(""); }} className="absolute right-1 top-1 rounded-full bg-white/90 p-1">
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : <ImageIcon className="h-6 w-6 text-neutral-300" />}
            </div>
            <label className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              Choose image
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
                  setError("Choose a JPEG, PNG, GIF, or WebP image smaller than 10 MB.");
                  return;
                }
                setCoverImage(file);
                setCoverPreview(URL.createObjectURL(file));
                setError("");
              }} />
            </label>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2">
        {(["info", "files", "review"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={cn(
                "rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition",
                step === s
                  ? "bg-blue-600 text-white"
                  : i < ["info", "files", "review"].indexOf(step)
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-200 text-neutral-600"
              )}
            >
              {i + 1}
            </button>
            {i < 2 && (
              <div className="w-8 h-0.5 bg-neutral-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step: App Info */}
      {step === "info" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              App Name *
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter your app name"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your app..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Release Notes
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What's new in this version?"
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGoToFiles}
              disabled={!appName.trim() || isLoading}
              className="flex-1 rounded-lg bg-blue-600 text-white font-medium py-2 transition hover:bg-blue-700 disabled:opacity-50"
            >
              Next: Upload Files
            </button>
          </div>
        </div>
      )}

      {/* Step: Files */}
      {step === "files" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Upload Files</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Upload executable files, installers, archives, or any other files your app needs.
            </p>
            <FileUpload
              onFilesSelected={setSelectedFiles}
              multiple={true}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("info")}
              className="flex-1 rounded-lg border border-neutral-300 text-neutral-900 font-medium py-2 transition hover:bg-neutral-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep("review")}
              disabled={selectedFiles.length === 0 && !createdAppId}
              className="flex-1 rounded-lg bg-blue-600 text-white font-medium py-2 transition hover:bg-blue-700 disabled:opacity-50"
            >
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Review Your Submission</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">App Name</p>
                  <p className="font-medium text-neutral-900">{appName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Category</p>
                  <p className="font-medium text-neutral-900">{category}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-600">Description</p>
                <p className="font-medium text-neutral-900">{description || "—"}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-600 mb-2">Files ({selectedFiles.length})</p>
                <div className="space-y-1">
                  {selectedFiles.map((file, i) => (
                    <p key={i} className="text-sm text-neutral-700">
                      • {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("files")}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-neutral-300 text-neutral-900 font-medium py-2 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmitApp}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-green-600 text-white font-medium py-2 transition hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Submit App
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
