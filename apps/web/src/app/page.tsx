import Link from "next/link";
import { AppCard } from "@/components/ui/card";
import Container from "@/components/layout/container";

const FEATURED_APPS = [
  { name: "CodeFlow", developer: "ByteWorks Inc.", category: "Productivity", rating: 4.8, downloads: "2.1M", icon: "⚡" },
  { name: "PixelPro", developer: "DesignLab", category: "Design & Art", rating: 4.6, downloads: "890K", icon: "🎨" },
  { name: "DataSync", developer: "CloudBase", category: "Utilities", rating: 4.5, downloads: "1.4M", icon: "🔄" },
  { name: "SoundWave", developer: "AudioCraft", category: "Music", rating: 4.9, downloads: "3.2M", icon: "🎵" },
  { name: "MapMaster", developer: "GeoTech", category: "Navigation", rating: 4.7, downloads: "5.1M", icon: "🗺️" },
  { name: "FitTrack", developer: "HealthFirst", category: "Health", rating: 4.8, downloads: "2.8M", icon: "💪" },
];

const CATEGORIES = [
  { name: "Productivity", icon: "⚡", count: "1.2K apps", color: "from-blue-500 to-cyan-500" },
  { name: "Design", icon: "🎨", count: "843 apps", color: "from-violet-500 to-pink-500" },
  { name: "Games", icon: "🎮", count: "4.7K apps", color: "from-orange-500 to-red-500" },
  { name: "Music", icon: "🎵", count: "621 apps", color: "from-emerald-500 to-teal-500" },
  { name: "Health", icon: "💪", count: "932 apps", color: "from-rose-500 to-pink-500" },
  { name: "Utilities", icon: "🔧", count: "1.8K apps", color: "from-slate-500 to-gray-600" },
  { name: "Education", icon: "📚", count: "2.1K apps", color: "from-amber-500 to-yellow-500" },
  { name: "Social", icon: "💬", count: "387 apps", color: "from-indigo-500 to-blue-500" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="gradient-hero-bg relative overflow-hidden py-24 sm:py-32">
        {/* Decorative glow orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-[#2D7FF9]/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <Container className="relative text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-blue-200 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            10,000+ apps from 5,000+ developers
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Discover Apps
            <br />
            <span className="text-[#60a5fa]">Built for Everyone</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-blue-200">
            DUspace is your cross-platform marketplace for discovering,
            downloading, and managing apps from independent developers worldwide.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur focus-within:ring-2 focus-within:ring-[#60a5fa]">
              <input
                id="hero-search"
                type="search"
                placeholder="Search apps, games, utilities…"
                className="flex-1 bg-transparent px-5 py-4 text-white placeholder-blue-300 outline-none"
                aria-label="Search apps"
              />
              <button
                id="hero-search-button"
                className="flex items-center gap-2 bg-[#2D7FF9] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#1a6de0]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                Search
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/apps"
              className="rounded-2xl bg-white px-8 py-3 font-semibold text-[#0F3B5C] shadow-lg transition hover:bg-blue-50 hover:shadow-xl"
            >
              Browse All Apps
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-white/30 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Become a Developer
            </Link>
          </div>
        </Container>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white py-6 dark:border-white/10 dark:bg-[#0d1b2e]">
        <Container>
          <dl className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { label: "Apps Available", value: "10,000+" },
              { label: "Active Developers", value: "5,000+" },
              { label: "Monthly Users", value: "500K+" },
              { label: "Categories", value: "50+" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-extrabold text-[#0F3B5C] dark:text-white">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="py-20">
        <Container>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Browse Categories
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Find apps for every need
              </p>
            </div>
            <Link
              href="/categories"
              className="text-sm font-medium text-[#2D7FF9] hover:underline"
            >
              All categories →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.name.toLowerCase()}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-xl text-white shadow-sm transition group-hover:scale-110 group-hover:shadow-md`}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {cat.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {cat.count}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Featured Apps ─────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-[#070d1a]">
        <Container>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Featured Apps
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Handpicked by our team this week
              </p>
            </div>
            <Link
              href="/apps"
              className="text-sm font-medium text-[#2D7FF9] hover:underline"
            >
              See all →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_APPS.map((app) => (
              <AppCard key={app.name} {...app} />
            ))}
          </div>
        </Container>
      </section>

      {/* ── Developer CTA ─────────────────────────────────── */}
      <section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3B5C] via-[#1a5a7a] to-[#2D7FF9] p-10 text-white sm:p-16">
            {/* bg decoration */}
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl"
            />

            <div className="relative grid gap-8 sm:grid-cols-2 sm:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm">
                  🚀 For Developers
                </div>
                <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                  Publish Your App.
                  <br />
                  Reach Millions.
                </h2>
                <p className="mt-4 text-blue-200">
                  List your apps on DUspace and connect with users across every
                  platform. Free to start, no gatekeeping.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="rounded-2xl bg-white px-6 py-3 font-semibold text-[#0F3B5C] shadow-lg transition hover:bg-blue-50"
                  >
                    Start Publishing
                  </Link>
                  <Link
                    href="/developers"
                    className="rounded-2xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-3">
                {[
                  "Free developer account",
                  "Upload unlimited apps",
                  "Real-time analytics",
                  "Built-in monetization",
                  "Cross-platform reach",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400">
                      ✓
                    </span>
                    <span className="text-sm text-blue-100">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}