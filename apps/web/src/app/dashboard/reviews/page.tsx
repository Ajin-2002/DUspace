"use client";

import { Star, Plus } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">My Reviews</h2>
        <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
          <Plus className="h-4 w-4" />
          Write Review
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 border-dashed bg-neutral-50 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm mb-4">
          <Star className="h-6 w-6 text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-900">No reviews yet</h3>
        <p className="text-xs text-neutral-500 mt-1">You haven't written any reviews.</p>
      </div>
    </div>
  );
}
