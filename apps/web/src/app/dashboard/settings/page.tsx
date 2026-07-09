"use client";

import { User, Shield, Bell, CreditCard as CreditCardIcon, Globe, Lock, ChevronRight } from "lucide-react";

const SETTINGS_SECTIONS = [
  { icon: User, label: "Profile", description: "Manage your personal information" },
  { icon: Shield, label: "Security", description: "Password, 2FA, and security settings" },
  { icon: Bell, label: "Notifications", description: "Choose what you want to be notified about" },
  { icon: CreditCardIcon, label: "Billing", description: "Payment methods and subscription plans" },
  { icon: Globe, label: "Preferences", description: "Language, region, and display preferences" },
  { icon: Lock, label: "Privacy", description: "Privacy controls and data management" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-neutral-900">Settings</h2>

      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <section.icon className="h-5 w-5 text-neutral-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{section.label}</p>
              <p className="text-xs text-neutral-500">{section.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
