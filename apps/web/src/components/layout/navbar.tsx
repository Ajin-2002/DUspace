"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import Container from "./container";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "/apps", label: "Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/developers", label: "Developers" },
];

/* ────────────────────────────────────────────────────────────
   SMALL COMPONENTS — mirrors the "Mark" pattern from the homepage
──────────────────────────────────────────────────────────── */

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 font-mono text-xs font-medium text-white transition group-hover:scale-105 dark:bg-white dark:text-neutral-900">
      {children}
    </span>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const isLoading = status === "loading";
  const dashboardHref = "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo — same square-mark language as the homepage app cards */}
        <Link href="/" className="group flex items-center gap-2.5">
          <Mark>D</Mark>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-white">
            DUspace
          </span>
        </Link>

        {/* Desktop nav links — pill indicator slides under the active item */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-white/10" />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle — matches homepage's outlined icon-button style */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>

          {/* Auth state */}
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100 dark:bg-white/10" />
          ) : session ? (
            /* Avatar dropdown */
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-button"
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-full p-1 pr-2.5 transition hover:bg-neutral-100 dark:hover:bg-white/10",
                  menuOpen && "bg-neutral-100 dark:bg-white/10"
                )}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {/* Single accent moment: orange → blue ring, DUspace's brand color, used nowhere else in the bar */}
                <span
                  className={cn(
                    "rounded-full p-[1.5px] transition",
                    menuOpen
                      ? "bg-gradient-to-br from-orange-400 to-blue-500"
                      : "bg-transparent"
                  )}
                >
                  <Avatar
                    src={session.user?.image}
                    name={session.user?.name}
                    size="sm"
                  />
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={cn(
                    "hidden h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 sm:block",
                    menuOpen && "rotate-180"
                  )}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-56 animate-fade-in rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-neutral-900"
                  role="menu"
                >
                  {/* User info */}
                  <div className="mb-2 border-b border-neutral-100 px-3 pb-2 dark:border-white/10">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                      {session.user?.name}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {session.user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <span></span>
                    My Dashboard
                  </Link>

                  {session.user?.isDeveloper && (
                    <Link
                      href="/developer"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                    >
                      <span></span>
                      Developer Portal
                    </Link>
                  )}

                  {session.user?.isDeveloper && (
                    <Link
                      href="/developer/submit"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                    >
                      <span></span>
                      Submit an App
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <span></span>
                    Settings
                  </Link>

                  <div className="mt-1 border-t border-neutral-100 pt-1 dark:border-white/10">
                    <button
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <span></span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out buttons — matches homepage's pill CTA */
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10 sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="group flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 md:hidden dark:border-white/10"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
              {mobileOpen ? (
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-neutral-950/95">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 font-medium transition",
                  pathname === link.href
                    ? "bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full bg-neutral-900 px-3 py-2.5 text-center font-semibold text-white dark:bg-white dark:text-neutral-900"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}