"use client";

import {
  User,
  Shield,
  Bell,
  CreditCard as CreditCardIcon,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    icon: User,
    label: "Profile",
    description: "Manage your personal information",
  },
  {
    icon: Shield,
    label: "Security",
    description: "Password, 2FA, and security settings",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Choose what you want to be notified about",
  },
  {
    icon: CreditCardIcon,
    label: "Billing",
    description: "Payment methods and subscription plans",
  },
  {
    icon: Globe,
    label: "Preferences",
    description: "Language, region, and display preferences",
  },
  {
    icon: Lock,
    label: "Privacy",
    description: "Privacy controls and data management",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account preferences and security.
        </p>
      </div>

      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)] transition hover:border-slate-300 hover:shadow-md sm:p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-slate-200">
              <section.icon className="h-5 w-5 text-slate-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {section.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {section.description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
