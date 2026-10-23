"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ExternalLink, Menu, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";

interface WorkspaceHeaderProps {
  kind: "user" | "developer";
  onMenuClick: () => void;
}

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/my-apps": "My apps",
  "/dashboard/downloads": "Downloads",
  "/dashboard/favorites": "Saved apps",
  "/dashboard/reviews": "Reviews",
  "/dashboard/developer-space": "Developer space",
  "/dashboard/settings": "Settings",
  "/dashboard/billing": "Billing",
  "/dashboard/support": "Help & support",
  "/developer": "Overview",
  "/developer/projects": "Projects",
  "/developer/apps": "Published apps",
  "/developer/releases": "Releases",
  "/developer/analytics": "Analytics",
  "/developer/earnings": "Earnings",
  "/developer/profile": "Profile",
  "/developer/notifications": "Notifications",
  "/developer/settings": "Settings",
  "/developer/submit": "Submit an app",
};

export function WorkspaceHeader({ kind, onMenuClick }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title =
    PAGE_NAMES[pathname] ??
    (pathname.includes("/projects/") ? "Project workspace" : "Workspace");
  const name =
    kind === "developer"
      ? session?.user?.developerProfile?.displayName ||
        session?.user?.name ||
        "Developer"
      : session?.user?.name || "User";

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
            <span>DUspace</span>
            <span className="text-slate-300">/</span>
            <span className="capitalize">{kind} workspace</span>
          </div>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 sm:mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href={
            kind === "developer"
              ? "/developer/notifications"
              : "/dashboard/settings"
          }
          aria-label={kind === "developer" ? "Notifications" : "Settings"}
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:flex"
        >
          {kind === "developer" ? (
            <Bell className="h-4 w-4" />
          ) : (
            <Settings className="h-4 w-4" />
          )}
        </Link>
        <Link
          href="/"
          className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
        >
          <span>Visit marketplace</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </Link>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2.5">
          <Avatar
            src={session?.user?.image}
            name={name}
            size="sm"
            className="bg-gradient-to-br from-slate-700 to-slate-950 ring-slate-200"
          />
          <div className="hidden max-w-36 sm:block">
            <p className="truncate text-xs font-semibold text-slate-800">
              {name}
            </p>
            <p className="text-[10px] font-medium capitalize text-slate-400">
              {kind} account
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
