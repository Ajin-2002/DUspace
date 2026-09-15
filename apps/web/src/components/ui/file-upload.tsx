"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  maxSize?: number; // in bytes
  accept?: string;
  multiple?: boolean;
  isLoading?: boolean;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 500 * 1024 * 1024, // 500MB default
  accept = "*",
  multiple = true,
  isLoading = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File is too large (max ${(maxSize / (1024 * 1024)).toFixed(0)}MB)`,
      };
    }
    return { valid: true };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validatedFiles: UploadedFile[] = newFiles.map((file) => {
      const validation = validateFile(file);
      return {
        file,
        progress: 0,
        status: validation.valid ? "pending" : "error",
        error: validation.error,
      };
    });

    const allFiles = multiple ? [...files, ...validatedFiles] : validatedFiles.slice(0, 1);
    setFiles(allFiles);

    if (onFilesSelected) {
      onFilesSelected(allFiles.filter((f) => f.status !== "error").map((f) => f.file));
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    if (onFilesSelected) {
      onFilesSelected(updatedFiles.filter((f) => f.status !== "error").map((f) => f.file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (["exe", "msi", "dmg", "pkg", "deb", "rpm"].includes(ext || ""))
      return "📦";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) return "📦";
    if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext || "")) return "📄";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
    if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext || "")) return "🎬";
    if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext || "")) return "🎵";
    if (["js", "ts", "py", "java", "cpp", "c", "html", "css"].includes(ext || ""))
      return "💻";

    return "📄";
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 transition cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInputChange}
          accept={accept}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="rounded-full bg-blue-100 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-medium text-neutral-900">
              Drag and drop files here or click to browse
            </p>
            <p className="text-sm text-neutral-500">
              Supports all file types up to 500MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <span className="text-2xl">{getFileIcon(file.file)}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {file.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                )}

                {file.status === "error" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}

                {file.status === "uploading" && (
                  <div className="shrink-0">
                    <div className="h-2 w-20 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => removeFile(index)}
                  disabled={file.status === "uploading" || isLoading}
                  className="rounded p-1 hover:bg-red-50 disabled:opacity-50 shrink-0"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {files.some((f) => f.status === "error") && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">
            {files.filter((f) => f.status === "error").map((f) => f.error).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
