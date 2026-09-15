"use client";

import {
  Globe,
  Smartphone,
  Monitor,
  Server,
  Package,
  Terminal,
  LayoutTemplate,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectType =
  | "web-app"
  | "mobile-app"
  | "desktop-app"
  | "api-backend"
  | "library-package"
  | "cli-tool"
  | "ui-component"
  | "developer-tool";

const PROJECT_TYPES: {
  value: ProjectType;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  { value: "web-app",        label: "Web Application",          description: "Browser-based app",      icon: Globe,           gradient: "from-blue-500 to-cyan-400" },
  { value: "mobile-app",     label: "Mobile Application",       description: "iOS / Android app",      icon: Smartphone,      gradient: "from-purple-500 to-pink-400" },
  { value: "desktop-app",    label: "Desktop Application",      description: "Windows / macOS / Linux", icon: Monitor,        gradient: "from-emerald-500 to-teal-400" },
  { value: "api-backend",    label: "API / Backend",            description: "Server-side service",    icon: Server,          gradient: "from-orange-500 to-amber-400" },
  { value: "library-package",label: "Library / Package",        description: "Reusable code package",  icon: Package,         gradient: "from-red-500 to-rose-400" },
  { value: "cli-tool",       label: "CLI Tool",                 description: "Command-line tool",      icon: Terminal,        gradient: "from-indigo-500 to-violet-400" },
  { value: "ui-component",   label: "UI Component / Template",  description: "Design components",      icon: LayoutTemplate,  gradient: "from-fuchsia-500 to-pink-400" },
  { value: "developer-tool", label: "Developer Tool",           description: "Dev tooling / DX",       icon: Wrench,          gradient: "from-neutral-600 to-neutral-800" },
];

interface ProjectTypeSelectorProps {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
}

export function ProjectTypeSelector({ value, onChange }: ProjectTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PROJECT_TYPES.map((type) => {
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
              isSelected
                ? "border-neutral-900 bg-neutral-900 text-white shadow-lg"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                isSelected
                  ? "bg-white/15"
                  : `bg-gradient-to-br ${type.gradient} text-white`
              )}
            >
              <type.icon className="h-5 w-5" />
            </div>
            <div>
              <p className={cn("text-xs font-semibold leading-tight", isSelected ? "text-white" : "text-neutral-900")}>
                {type.label}
              </p>
              <p className={cn("mt-0.5 text-[10px]", isSelected ? "text-white/70" : "text-neutral-500")}>
                {type.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { PROJECT_TYPES };
