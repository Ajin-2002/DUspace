"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import Container from "./container";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
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
  const dashboardHref =
    session?.user?.role === "developer" ? "/developer" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#070d1a]/80">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-[#0F3B5C] dark:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F3B5C] to-[#2D7FF9] text-sm text-white shadow-sm">
            D
          </span>
          DUspace
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden gap-6 md:flex text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link href="/apps" className="transition hover:text-[#0F3B5C] dark:hover:text-white">
            Apps
          </Link>
          <Link href="/categories" className="transition hover:text-[#0F3B5C] dark:hover:text-white">
            Categories
          </Link>
          <Link href="/developers" className="transition hover:text-[#0F3B5C] dark:hover:text-white">
            Developers
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg border border-gray-200 p-2 text-sm transition hover:bg-gray-100 dark:border-white/10 dark:hover:bg-white/10"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Auth state */}
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
          ) : session ? (
            /* Avatar dropdown */
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-gray-100 dark:hover:bg-white/10"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <Avatar
                  src={session.user?.image}
                  name={session.user?.name}
                  size="sm"
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={cn(
                    "hidden h-4 w-4 text-gray-500 transition-transform duration-200 sm:block",
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
                  className="absolute right-0 mt-2 w-56 animate-fade-in rounded-2xl border border-gray-200/60 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0d1b2e]"
                  role="menu"
                >
                  {/* User info */}
                  <div className="mb-2 border-b border-gray-100 px-3 pb-2 dark:border-white/10">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {session.user?.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <Link
                    href={dashboardHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    <span>📊</span>
                    {session.user?.role === "developer"
                      ? "Developer Portal"
                      : "My Dashboard"}
                  </Link>

                  {session.user?.role === "developer" && (
                    <Link
                      href="/developer/submit"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                      <span>🚀</span>
                      Submit an App
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    <span>⚙️</span>
                    Settings
                  </Link>

                  <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/10">
                    <button
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <span>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#0F3B5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a5a7a]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-button"
            className="rounded-lg border border-gray-200 p-2 md:hidden dark:border-white/10"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
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
        <div className="border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-[#070d1a]/95">
          <nav className="flex flex-col gap-1 text-sm">
            {[
              { href: "/apps", label: "Apps" },
              { href: "/categories", label: "Categories" },
              { href: "/developers", label: "Developers" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-[#0F3B5C] px-3 py-2.5 text-center font-semibold text-white"
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