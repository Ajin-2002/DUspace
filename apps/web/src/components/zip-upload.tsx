import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Deployment {
  zipFileName: string;
  projectType: string;
  buildTime: number;
  outputSize: number;
  deployedAt: string;
  liveUrl: string;
  buildStatus: "building" | "success" | "failed";
  buildError?: string;
}

interface AppWithDeployments {
  _id: string;
  name: string;
  deployments?: Deployment[];
}

export default function ZipUploadForm({ appId }: { appId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<number | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [polling, setPolling] = useState(false);

  // Poll for deployment status
  useEffect(() => {
    if (!deploymentId || !polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/developer/apps/${appId}`), {
          headers: {
            Authorization: `Bearer ${session?.user?.token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch app");

        const { app } = (await res.json()) as { app: AppWithDeployments };
        setDeployments(app.deployments || []);

        // Check if build is complete
        const currentDeploy = app.deployments?.[0];
        if (currentDeploy?.buildStatus !== "building") {
          setPolling(false);
          if (currentDeploy?.buildStatus === "success") {
            setSuccess(`Build successful! Live URL: ${currentDeploy.liveUrl}`);
          } else if (currentDeploy?.buildStatus === "failed") {
            setError(`Build failed: ${currentDeploy.buildError}`);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [deploymentId, polling, appId, session?.user?.token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        setError("Please select a valid ZIP file");
        return;
      }
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError("File size exceeds 500MB limit");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const input = document.createElement("input");
      input.type = "file";
      Object.defineProperty(input, "files", {
        value: e.dataTransfer.files,
      });
      const event = new Event("change", { bubbles: true });
      Object.defineProperty(event, "target", { value: input, enumerable: true });
      handleFileChange(event as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session?.user?.token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("zip", file);

      const res = await fetch(getApiUrl(`/api/developer/apps/${appId}/upload-zip`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      setDeploymentId(data.deploymentId);
      setDeployments([data.deployment]);
      setSuccess("Upload successful! Build in progress...");
      setFile(null);
      setPolling(true);

      // Reset form
      const input = document.getElementById("zip-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors"
        >
          <input
            id="zip-input"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="zip-input" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-semibold text-gray-700">
              {file ? file.name : "Drop your ZIP file here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to select</p>
            <p className="text-xs text-gray-400 mt-2">Max 500MB • ZIP format only</p>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload & Deploy
            </>
          )}
        </button>
      </form>

      {/* Deployments List */}
      {deployments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Deployments</h3>

          {deployments.map((deployment, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{deployment.zipFileName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Project Type: <span className="font-medium">{deployment.projectType}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {deployment.buildStatus === "building" && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Building...</span>
                    </div>
                  )}
                  {deployment.buildStatus === "success" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Success</span>
                    </div>
                  )}
                  {deployment.buildStatus === "failed" && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Build Time</p>
                  <p className="font-medium text-gray-900">
                    {deployment.buildTime > 0 ? `${deployment.buildTime}ms` : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Output Size</p>
                  <p className="font-medium text-gray-900">
                    {deployment.outputSize > 0
                      ? `${(deployment.outputSize / 1024 / 1024).toFixed(2)}MB`
                      : "Pending"}
                  </p>
                </div>
              </div>

              {deployment.buildError && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-semibold text-red-900">Error:</p>
                  <p className="text-sm text-red-800 font-mono break-all">
                    {deployment.buildError}
                  </p>
                </div>
              )}

              {deployment.buildStatus === "success" && (
                <a
                  href={deployment.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live Deployment
                </a>
              )}

              <p className="text-xs text-gray-500">
                Deployed: {new Date(deployment.deployedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
