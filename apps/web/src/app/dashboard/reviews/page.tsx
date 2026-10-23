"use client";

import { Star, Plus } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            My reviews
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ratings and feedback you&apos;ve shared with the community.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          Write Review
        </button>
      </div>

      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <Star className="h-6 w-6 text-slate-700" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          No reviews yet
        </h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Your feedback helps other people choose great apps. Your reviews will
          appear here.
        </p>
      </div>
    </div>
  );
}
