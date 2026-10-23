"use client";

import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Billing
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review your plan and payment activity.
          </p>
        </div>
        <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          Upgrade Plan
        </button>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.25)] sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Standard plan
            </p>
            <p className="mt-1 text-sm text-slate-500">Free tier</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Active
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Billing history
        </h3>
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <CreditCard className="h-5 w-5 text-slate-700" />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            No billing history
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Your payment history will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
