"use client";

import { useSession } from "next-auth/react";
import { Settings, Shield, Bell, Globe } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    icon: Settings,
    label: "Developer Profile",
    description: "Manage your public developer presence",
  },
  {
    icon: Shield,
    label: "Security & API Keys",
    description: "Manage API access and security",
  },
  {
    icon: Bell,
    label: "Developer Notifications",
    description: "Alerts for reviews and app status",
  },
  {
    icon: Globe,
    label: "Banking Information",
    description: "Configure payout methods",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Developer settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your creator account preferences.
        </p>
      </div>

      {/* Developer Profile Overview */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.25)]">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Public profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Developer / company name
            </label>
            <input
              type="text"
              defaultValue={session?.user?.developerProfile?.displayName}
              disabled
              className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              Contact support to change your verified developer name.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)] transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
              <section.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {section.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {section.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
