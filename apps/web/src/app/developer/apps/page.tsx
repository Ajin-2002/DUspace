"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Package, Plus, Filter, Search, MoreVertical, Trash2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

interface AppFile {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  fileType: "executable" | "installer" | "source" | "document" | "media" | "archive" | "other";
}

interface App {
  _id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  files: AppFile[];
  status: "draft" | "pending" | "published" | "rejected";
  visibility: "private" | "public";
  createdAt: string;
  publishedAt?: string;
  coverImage?: string;
}

export default function PublishedAppsPage() {
  const { data: session } = useSession();
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, [session]);

  const fetchApps = async () => {
    if (!session?.user?.token) {
      setError("No authentication token available. Please sign in.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const appsUrl = getApiUrl("/api/developer/apps");
      console.log("Fetching from:", appsUrl);
      console.log("Token available:", !!session.user.token);
      
      const res = await fetch(appsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", res.status, res.statusText);

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Error response:", errorData);
        } catch (e) {
          const text = await res.text();
          console.error("Error response text:", text);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("Apps fetched successfully:", data.apps?.length || 0, "apps");
      setApps(data.apps || []);
      setError("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load apps";
      console.error("Fetch apps error:", errorMsg);
      console.error("Full error:", err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm("Are you sure you want to delete this app?")) return;

    try {
      setDeletingId(appId);
      const res = await fetch(getApiUrl(`/api/developer/apps/${appId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Response not JSON
        }
        throw new Error(errorMsg);
      }

      setApps(apps.filter((a) => a._id !== appId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete app";
      console.error("Delete error:", err);
      alert(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishApp = async (appId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${appId}/publish`), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session?.user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Response not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setApps(apps.map((a) => (a._id === appId ? data.app : a)));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to publish app";
      console.error("Publish error:", err);
      alert(errorMsg);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesFilter = filter === "all" || app.status === filter;
    const matchesSearch = app.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Published Apps</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your applications and uploads
          </p>
        </div>
        <Link
          href="/developer/submit"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create New App
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters/Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search your apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition capitalize",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Apps List */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 border-dashed bg-neutral-50 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 mb-5">
            <Package className="h-8 w-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900">No apps yet</h3>
          <p className="text-sm text-neutral-600 mt-2 mb-6 max-w-sm">
            {searchTerm
              ? "No apps match your search"
              : "You haven't created any applications yet."}
          </p>
          {!searchTerm && (
            <Link
              href="/developer/submit"
              className="flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Create New App
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApps.map((app) => (
            <div
              key={app._id}
              className="rounded-xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                {app.coverImage && (
                  <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <img src={getApiUrl(app.coverImage)} alt={`${app.name} cover`} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{app.name}</h3>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        app.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      )}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">{app.description || "—"}</p>

                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-neutral-200">
                    <div>
                      <p className="text-xs text-neutral-500">Category</p>
                      <p className="text-sm font-medium text-neutral-900">{app.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Version</p>
                      <p className="text-sm font-medium text-neutral-900">{app.version}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Files</p>
                      <p className="text-sm font-medium text-neutral-900">{app.files.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Created</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Files List */}
                  {app.files.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-xs font-medium text-neutral-600 mb-2">Files:</p>
                      <div className="space-y-1">
                        {app.files.slice(0, 3).map((file, i) => (
                          <p key={i} className="text-xs text-neutral-600">
                            • {file.originalName} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        ))}
                        {app.files.length > 3 && (
                          <p className="text-xs text-neutral-500">
                            +{app.files.length - 3} more file{app.files.length - 3 !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {app.status === "draft" && (
                    <button
                      onClick={() => handlePublishApp(app._id)}
                      className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium transition hover:bg-green-700"
                      title="Publish this app"
                    >
                      <FileUp className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteApp(app._id)}
                    disabled={deletingId === app._id}
                    className="rounded-lg hover:bg-red-50 text-red-600 px-3 py-2 text-sm font-medium transition disabled:opacity-50"
                    title="Delete this app"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
