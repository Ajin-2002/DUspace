"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  suggestions?: string[];
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tag…",
  maxTags = 20,
  className,
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return;
    onChange([...value, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex min-h-[42px] flex-wrap gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900/10 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(tag); }}
              className="ml-0.5 rounded-full text-neutral-400 hover:text-neutral-700 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && input.length > 0 && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); add(s); }}
              className="w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1 text-[11px] text-neutral-400">
        Press Enter or comma to add · {value.length}/{maxTags}
      </p>
    </div>
  );
}
