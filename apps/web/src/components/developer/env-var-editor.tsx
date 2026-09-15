"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvVarEditorProps {
  value: EnvVar[];
  onChange: (vars: EnvVar[]) => void;
}

export function EnvVarEditor({ value, onChange }: EnvVarEditorProps) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const add = () => {
    onChange([...value, { key: "", value: "", isSecret: true }]);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const update = (index: number, field: keyof EnvVar, val: string | boolean) => {
    const updated = [...value];
    (updated[index] as any)[field] = val;
    onChange(updated);
  };

  const toggleReveal = (index: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-8 text-center">
          <Lock className="mb-2 h-6 w-6 text-neutral-300" />
          <p className="text-sm text-neutral-500">No environment variables yet</p>
          <p className="mt-0.5 text-xs text-neutral-400">Secrets are encrypted at rest</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-0 text-xs font-medium uppercase tracking-wide text-neutral-400 bg-neutral-50 px-4 py-2 border-b border-neutral-200">
            <span>Variable</span>
            <span>Value</span>
            <span className="text-center">Type</span>
            <span />
          </div>
          {value.map((ev, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-4 py-2.5 items-center",
                i < value.length - 1 ? "border-b border-neutral-100" : ""
              )}
            >
              {/* Key */}
              <input
                value={ev.key}
                onChange={(e) => update(i, "key", e.target.value)}
                placeholder="VARIABLE_NAME"
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />

              {/* Value */}
              <div className="relative">
                <input
                  type={ev.isSecret && !revealed.has(i) ? "password" : "text"}
                  value={ev.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                  placeholder="value"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 pr-8 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                />
                {ev.isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleReveal(i)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {revealed.has(i) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {/* Secret toggle */}
              <button
                type="button"
                onClick={() => update(i, "isSecret", !ev.isSecret)}
                title={ev.isSecret ? "Secret (click to make public)" : "Public (click to make secret)"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg border transition",
                  ev.isSecret
                    ? "border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100"
                    : "border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
                )}
              >
                {ev.isSecret ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              </button>

              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 py-2.5 text-sm font-medium text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700"
      >
        <Plus className="h-4 w-4" />
        Add variable
      </button>

      <p className="text-[11px] text-neutral-400">
        <Lock className="inline h-3 w-3 mr-1" />
        Secret values are encrypted with AES-256 and never exposed publicly.
      </p>
    </div>
  );
}
