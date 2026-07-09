"use client";

import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Billing</h2>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
          Upgrade Plan
        </button>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Current Plan</p>
            <p className="text-2xl font-bold text-neutral-900">Standard Plan</p>
            <p className="text-sm text-neutral-600">Free tier</p>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Active
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-neutral-900">Billing History</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-neutral-200 border-dashed bg-neutral-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm mb-3">
            <CreditCard className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-900">No billing history</p>
          <p className="text-xs text-neutral-500 mt-1">Your payment history will appear here.</p>
        </div>
      </div>
    </div>
  );
}
