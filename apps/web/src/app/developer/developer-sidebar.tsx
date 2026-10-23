"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  LayoutDashboard,
  Boxes,
  Package,
  Tag,
  BarChart3,
  User,
  Bell,
  ArrowLeft,
  Zap,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        id: "overview",
        icon: LayoutDashboard,
        label: "Overview",
        href: "/developer",
      },
    ],
  },
  {
    label: "Projects",
    items: [
      {
        id: "projects",
        icon: Boxes,
        label: "Workspaces",
        href: "/developer/projects",
      },
      {
        id: "design-library",
        icon: Palette,
        label: "Design Library",
        href: "/developer/design-library",
      },
      {
        id: "published-apps",
        icon: Package,
        label: "Published apps",
        href: "/developer/apps",
      },
      {
        id: "releases",
        icon: Tag,
        label: "All Releases",
        href: "/developer/releases",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        id: "analytics",
        icon: BarChart3,
        label: "Analytics",
        href: "/developer/analytics",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "profile",
        icon: User,
        label: "Profile",
        href: "/developer/profile",
      },
      {
        id: "notifications",
        icon: Bell,
        label: "Notifications",
        href: "/developer/notifications",
      },
    ],
  },
];

interface DeveloperSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function DeveloperSidebar({
  sidebarOpen,
  setSidebarOpen,
}: DeveloperSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const displayName =
    session?.user?.developerProfile?.displayName ||
    session?.user?.name ||
    "Developer";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <aside
        aria-label="Developer workspace navigation"
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-50 flex w-[min(82vw,256px)] shrink-0 flex-col overflow-hidden",
          "border-r border-slate-200 bg-white",
          "transition-[width,transform] duration-200 ease-in-out",
          "lg:static lg:z-0 lg:h-full lg:w-[72px] lg:translate-x-0 lg:hover:w-[clamp(224px,19vw,248px)] lg:focus-within:w-[clamp(224px,19vw,248px)] 2xl:hover:w-64 2xl:focus-within:w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-100 px-4 lg:justify-center lg:gap-0 lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 shadow-sm">
            <Code2 className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="flex max-w-48 flex-col gap-0.5 overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-48 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-48 lg:group-focus-within/sidebar:opacity-100">
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              DUspace
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Creator workspace
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 lg:px-2 lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:px-3">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 opacity-100 transition-opacity duration-200 lg:invisible lg:h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sidebar:visible lg:group-hover/sidebar:h-auto lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:visible lg:group-focus-within/sidebar:h-auto lg:group-focus-within/sidebar:opacity-100">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/developer"
                      ? pathname === "/developer"
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group relative mx-0 flex h-auto w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:h-auto lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:mx-0 lg:group-focus-within/sidebar:h-auto lg:group-focus-within/sidebar:w-full lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3 lg:group-focus-within/sidebar:px-3",
                        isActive
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[17px] w-[17px] shrink-0 transition-colors",
                          isActive
                            ? "text-slate-900"
                            : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      <span className="max-w-40 flex-1 truncate overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-40 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-40 lg:group-focus-within/sidebar:opacity-100">
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-slate-900" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-3 py-3 lg:px-2 lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:px-3">
          {/* Back to User Space */}
          <a
            href="/dashboard"
            className="mx-0 flex h-auto w-full items-center justify-start gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:p-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:h-auto lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-2.5 lg:group-hover/sidebar:px-2.5 lg:group-hover/sidebar:py-2.5 lg:group-focus-within/sidebar:mx-0 lg:group-focus-within/sidebar:h-auto lg:group-focus-within/sidebar:w-full lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-2.5 lg:group-focus-within/sidebar:px-2.5 lg:group-focus-within/sidebar:py-2.5"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="max-w-40 flex-1 truncate overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-40 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-40 lg:group-focus-within/sidebar:opacity-100">
              Personal workspace
            </span>
          </a>

          {/* Developer profile card */}
          <Link
            href="/developer/profile"
            className="mx-0 flex h-auto w-full items-center justify-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 transition hover:border-slate-300 hover:bg-slate-100 lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:p-1 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:h-auto lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-2.5 lg:group-hover/sidebar:px-2.5 lg:group-hover/sidebar:py-2.5 lg:group-focus-within/sidebar:mx-0 lg:group-focus-within/sidebar:h-auto lg:group-focus-within/sidebar:w-full lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-2.5 lg:group-focus-within/sidebar:px-2.5 lg:group-focus-within/sidebar:py-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[12px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 max-w-40 flex-1 overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-40 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-40 lg:group-focus-within/sidebar:opacity-100">
              <p className="mb-1 truncate text-[12px] font-semibold leading-none text-slate-900">
                {displayName}
              </p>
              <p className="text-[10px] font-medium capitalize text-slate-500">
                Developer account
              </p>
            </div>
            <Zap className="hidden h-4 w-4 shrink-0 text-slate-400 lg:group-hover/sidebar:block lg:group-focus-within/sidebar:block" />
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
