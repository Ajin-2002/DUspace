"use client";

import { useSession } from "next-auth/react";
import { Settings, Shield, Bell, Globe } from "lucide-react";

const SETTINGS_SECTIONS = [
  { icon: Settings, label: "Developer Profile", description: "Manage your public developer presence" },
  { icon: Shield, label: "Security & API Keys", description: "Manage API access and security" },
  { icon: Bell, label: "Developer Notifications", description: "Alerts for reviews and app status" },
  { icon: Globe, label: "Banking Information", description: "Configure payout methods" },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Developer Settings</h1>
        <p className="mt-1 text-sm text-neutral-400">Manage your developer account preferences.</p>
      </div>

      {/* Developer Profile Overview */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-white mb-4">Public Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Developer / Company Name</label>
            <input 
              type="text" 
              defaultValue={session?.user?.developerProfile?.displayName}
              disabled
              className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
            />
            <p className="mt-1 text-xs text-neutral-500">Contact support to change your verified developer name.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="group flex cursor-pointer flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-sm transition hover:border-neutral-700 hover:bg-neutral-800"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-blue-600/10 group-hover:text-blue-500">
              <section.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white">{section.label}</p>
              <p className="mt-1 text-xs text-neutral-400">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
