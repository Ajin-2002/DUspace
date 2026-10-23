"use client";

import { CreditCard, ArrowUpRight } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Earnings & payouts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your revenue, payment details, and payout history.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <ArrowUpRight className="h-4 w-4" />
          Request Payout
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 p-7 text-white shadow-[0_22px_55px_-30px_rgba(15,23,42,0.5)] sm:p-8">
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-2 -top-8 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
            Available balance
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">$0.00</h2>
          <div className="mt-6 flex items-center gap-5 border-t border-white/15 pt-6">
            <div>
              <p className="text-xs text-white/60">Pending</p>
              <p className="text-lg font-semibold">$0.00</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <p className="text-xs text-white/60">Last payout</p>
              <p className="text-lg font-semibold">$0.00</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Payout history
        </h3>
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            <CreditCard className="h-6 w-6 text-slate-700" />
          </div>
          <p className="text-base font-semibold text-slate-900">
            No payout history
          </p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            Your past earnings and transfers will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
