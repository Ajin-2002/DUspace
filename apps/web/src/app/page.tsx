"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/container";
import {
  Search,
  PlayCircle,
  ArrowRight,
  ArrowUpRight,
  Star,
  ShieldCheck,
  Puzzle,
  RefreshCw,
  Headphones,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  Zap,
  Award,
  Clock,
  ChevronRight,
  Rocket,
  Package,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

/* ────────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────────── */

interface PublicApp {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  version: string;
  rating?: number;
  status: string;
  publishedAt?: string;
  createdAt: string;
  coverImage?: string;
  files: { fileType: string }[];
}

/* ────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────── */

const CATEGORY_NAMES = [
  "Productivity",
  "Design",
  "Development",
  "Marketing",
  "Education",
  "Utilities",
];

const CATEGORY_COLORS: Record<string, string> = {
  Productivity: "from-blue-500 to-cyan-400",
  Design: "from-purple-500 to-pink-400",
  Development: "from-emerald-500 to-teal-400",
  Marketing: "from-orange-500 to-amber-400",
  Education: "from-red-500 to-rose-400",
  Utilities: "from-indigo-500 to-violet-400",
  Media: "from-fuchsia-500 to-pink-400",
  Other: "from-neutral-500 to-neutral-700",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "from-neutral-700 to-neutral-900";
}

const TOP_DEVELOPERS = [
  { name: "PixelWave", apps: 22, rating: 4.8, badge: "Top Rated" },
  { name: "CodeCrafters", apps: 45, rating: 4.9, badge: "Most Apps" },
  { name: "DevSolutions", apps: 31, rating: 4.7, badge: "Trusted" },
  { name: "The App Lab", apps: 28, rating: 4.8, badge: "Featured" },
  { name: "Creative Studio", apps: 19, rating: 4.6, badge: "Rising" },
  { name: "BluePeak", apps: 33, rating: 4.8, badge: "Verified" },
];

const STATS = [
  { label: "Applications", value: "2,500+", icon: LayoutGrid },
  { label: "Developers", value: "15,000+", icon: Award },
  { label: "Downloads", value: "1M+", icon: TrendingUp },
  { label: "Countries", value: "120+", icon: Zap },
];

const WHY_CHOOSE = [
  {
    title: "Wide selection",
    desc: "Thousands of high-quality applications in one place.",
    icon: LayoutGrid,
    color: "from-blue-500 to-cyan-400",
  },
  {
    title: "Secure & trusted",
    desc: "Every application is verified for your safety.",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-400",
  },
  {
    title: "Easy integration",
    desc: "Fits into the workflow you already have.",
    icon: Puzzle,
    color: "from-purple-500 to-pink-400",
  },
  {
    title: "Regular updates",
    desc: "Stay current with the latest features.",
    icon: RefreshCw,
    color: "from-orange-500 to-amber-400",
  },
  {
    title: "Dedicated support",
    desc: "Our team is here when you need it.",
    icon: Headphones,
    color: "from-red-500 to-rose-400",
  },
];

/* ────────────────────────────────────────────────────────────
   HOOKS
──────────────────────────────────────────────────────────── */

function usePublicApps(sort: string, limit: number) {
  const [apps, setApps] = useState<PublicApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(getApiUrl(`/api/apps?sort=${sort}&limit=${limit}`))
      .then((r) => r.json())
      .then((data) => {
        setApps(data.apps ?? []);
      })
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [sort, limit]);

  return { apps, loading };
}

/* ────────────────────────────────────────────────────────────
   SCROLL REVEAL
──────────────────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  className = "",
  animation = "fade-up",
  duration = 0.9,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "flip" | "rotate" | "bounce";
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getStyles = () => {
    if (!visible) {
      switch (animation) {
        case "fade-up": return { opacity: 0, transform: "translateY(60px) scale(0.95)" };
        case "fade-down": return { opacity: 0, transform: "translateY(-60px) scale(0.95)" };
        case "fade-left": return { opacity: 0, transform: "translateX(60px) scale(0.95)" };
        case "fade-right": return { opacity: 0, transform: "translateX(-60px) scale(0.95)" };
        case "zoom-in": return { opacity: 0, transform: "scale(0.5) rotate(-5deg)" };
        case "flip": return { opacity: 0, transform: "rotateY(90deg) scale(0.8)" };
        case "rotate": return { opacity: 0, transform: "rotate(180deg) scale(0.5)" };
        case "bounce": return { opacity: 0, transform: "translateY(80px) scale(0.9)" };
        default: return { opacity: 0, transform: "translateY(40px)" };
      }
    }
    return { opacity: 1, transform: "translateY(0) scale(1) rotate(0deg) rotateY(0deg)" };
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...getStyles(),
        transition: `all ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ANIMATED DOTS — Client-side only
──────────────────────────────────────────────────────────── */

function AnimatedDots() {
  const [dots, setDots] = useState<Array<{
    id: number;
    size: number;
    top: number;
    duration: number;
    delay: number;
    opacity: number;
    waveHeight: number;
  }>>([]);

  useEffect(() => {
    const generatedDots = Array.from({ length: 60 }, (_, i) => {
      const size = Math.floor(Math.random() * 6) + 2;
      const top = Math.random() * 100;
      const duration = Math.random() * 4 + 4;
      const delay = Math.random() * 8;
      const opacity = Math.random() * 0.35 + 0.3;
      const waveHeight = Math.random() * 20 + 5;
      return { id: i, size, top, duration, delay, opacity, waveHeight };
    });
    setDots(generatedDots);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes floatLeftToRight {
          0% {
            transform: translateX(-50px) translateY(0px);
            opacity: 0;
          }
          5% {
            opacity: var(--dot-opacity, 0.5);
          }
          50% {
            transform: translateX(50vw) translateY(var(--wave-height, 15px));
            opacity: var(--dot-opacity, 0.5);
          }
          95% {
            opacity: var(--dot-opacity, 0.5);
          }
          100% {
            transform: translateX(calc(100vw + 50px)) translateY(0px);
            opacity: 0;
          }
        }
        
        .dot-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          will-change: transform, opacity;
          animation: floatLeftToRight linear infinite;
        }
        
        .dot-particle.small {
          filter: blur(0px);
        }
        .dot-particle.medium {
          filter: blur(0.3px);
        }
        .dot-particle.large {
          filter: blur(0.8px);
        }
      `}</style>

      {dots.map((dot) => {
        const sizeClass = dot.size < 4 ? "small" : dot.size < 6 ? "medium" : "large";

        return (
          <div
            key={dot.id}
            className={`dot-particle ${sizeClass}`}
            style={
              {
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                top: `${dot.top}%`,
                animationDuration: `${dot.duration}s`,
                animationDelay: `${dot.delay}s`,
                "--wave-height": `${dot.waveHeight}px`,
                "--dot-opacity": dot.opacity,
              } as React.CSSProperties
            }
          />
        );
      })}

      <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SMALL COMPONENTS
──────────────────────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  href,
  cta = "View all",
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  href: string;
  cta?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="mb-8 flex items-end justify-between border-b border-neutral-100 pb-6">
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 flex items-center gap-2.5">
          {title}
          {Icon && <Icon className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />}
        </h2>
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 py-1.5 pl-3.5 pr-2.5 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-4 overflow-x-auto pb-2 pl-1 pr-8 pt-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
      style={{ maskImage: "linear-gradient(to right, black 92%, transparent)" }}
    >
      {children}
    </div>
  );
}

function Rating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-neutral-500">
      <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
      {rating.toFixed(1)}
    </span>
  );
}

function Mark({ children, gradient = "" }: { children: React.ReactNode; gradient?: string }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${gradient || "from-neutral-800 to-neutral-900"} font-mono text-xs font-medium text-white shadow-sm ring-1 ring-neutral-900/5 transition group-hover:scale-105`}>
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`group rounded-2xl border border-neutral-200/80 bg-white transition duration-300 ease-out hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Skeleton Cards ─────────────────────────────────────── */

function SkeletonFeaturedCard() {
  return (
    <div className="w-52 shrink-0 rounded-2xl border border-neutral-200/80 bg-white p-5 animate-pulse">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-neutral-200" />
        <div className="h-4 w-8 rounded bg-neutral-200" />
      </div>
      <div className="h-4 w-28 rounded bg-neutral-200" />
      <div className="mt-1.5 h-3 w-20 rounded bg-neutral-100" />
      <div className="mt-4 border-t border-neutral-100 pt-3 flex items-center justify-between">
        <div className="h-5 w-10 rounded-full bg-neutral-100" />
        <div className="h-3 w-3 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

function SkeletonNewCard() {
  return (
    <div className="w-40 shrink-0 rounded-2xl border border-neutral-200/80 bg-white p-5 animate-pulse flex flex-col gap-3">
      <div className="h-10 w-10 rounded-lg bg-neutral-200" />
      <div className="h-4 w-24 rounded bg-neutral-200" />
      <div className="h-3 w-12 rounded bg-neutral-100" />
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */

function EmptyApps({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center w-full">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 mb-3">
        <Package className="h-7 w-7 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <p className="text-xs text-neutral-400 mt-1">
        Be the first to{" "}
        <Link href="/developer/submit" className="underline hover:text-neutral-700">
          publish an app
        </Link>
        .
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   LIVE APP SECTIONS
──────────────────────────────────────────────────────────── */

function FeaturedAppsSection() {
  const { apps, loading } = usePublicApps("rating", 8);

  return (
    <section className="relative overflow-hidden py-16">
      {/* Background image */}
      <img
        src="/featured-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Semi-transparent overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-white/80 backdrop-blur-sm" />

      <Container className="relative z-10">
        <Reveal>
          <SectionHeader
            eyebrow="Selected"
            title="Featured applications"
            href="/apps?filter=featured"
            icon={Sparkles}
          />
        </Reveal>
        <Row>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonFeaturedCard key={i} />)
          ) : apps.length === 0 ? (
            <EmptyApps label="No featured apps yet" />
          ) : (
            apps.map((app, i) => (
              <Reveal key={app._id} delay={i * 60} className="shrink-0">
                <Link href={`/apps/${app.slug || app._id}`}>
                  <Card className="w-56 overflow-hidden flex flex-col group/card">
                    {app.coverImage ? (
                      <div className="relative h-56 w-full overflow-hidden bg-neutral-100">
                        <img 
                          src={getApiUrl(app.coverImage)} 
                          alt={app.name}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-4 pt-12 text-white">
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{app.name}</p>
                              <p className="mt-0.5 truncate text-xs text-white/75">{app.category}</p>
                            </div>
                            <Rating rating={app.rating ?? 0} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 pb-0">
                        <div className="mb-4 flex items-start justify-between">
                          <Mark gradient={getCategoryColor(app.category)}>
                            {app.name.charAt(0).toUpperCase()}
                          </Mark>
                          <Rating rating={app.rating ?? 0} />
                        </div>
                      </div>
                    )}
                    {!app.coverImage && <div className="p-5 pt-4">
                      <p className="text-sm font-medium text-neutral-900 truncate">{app.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-400 truncate">{app.category}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600">
                          Free
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900" />
                      </div>
                    </div>}
                    {app.coverImage && <div className="flex items-center justify-end px-5 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600">Free</span>
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900" />
                    </div>}
                  </Card>
                </Link>
              </Reveal>
            ))
          )}
        </Row>
      </Container>
    </section>
  );
}

function NewReleasesSection() {
  const { apps, loading } = usePublicApps("newest", 8);

  return (
    <section className="pb-16">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="Just shipped"
            title="New releases"
            href="/apps?filter=new"
            icon={Clock}
          />
        </Reveal>
        <Row>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonNewCard key={i} />)
          ) : apps.length === 0 ? (
            <EmptyApps label="No apps released yet" />
          ) : (
            apps.map((app, i) => (
              <Reveal key={app._id} delay={i * 60} className="shrink-0">
                <Link href={`/apps/${app.slug || app._id}`}>
                  <Card className="w-48 flex flex-col overflow-hidden group/card">
                    {app.coverImage ? (
                      <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
                        <img 
                          src={getApiUrl(app.coverImage)} 
                          alt={app.name}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3 pt-10 text-white">
                          <p className="truncate text-sm font-semibold">{app.name}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-white/75">{app.category}</p>
                            <Rating rating={app.rating ?? 0} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 pb-0">
                        <Mark gradient={getCategoryColor(app.category)}>
                          {app.name.charAt(0).toUpperCase()}
                        </Mark>
                      </div>
                    )}
                    {!app.coverImage && <div className="p-5 pt-3">
                      <p className="text-sm font-medium text-neutral-900 truncate mb-1.5">{app.name}</p>
                      <Rating rating={app.rating ?? 0} />
                    </div>}
                  </Card>
                </Link>
              </Reveal>
            ))
          )}
        </Row>
      </Container>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   HERO SECTION — Light gradient background
──────────────────────────────────────────────────────────── */

function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-blue-50/50 via-white to-purple-50/30">
      {mounted && <AnimatedDots />}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <Container>
        <div className="relative py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal animation="flip" delay={100}>
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
                Discover the tools worth building on.
              </h1>
            </Reveal>

            <Reveal animation="fade-up" delay={200}>
              <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-neutral-500">
                DUspace is a curated directory of applications, vetted developers, and the
                categories that actually matter — nothing else.
              </p>
            </Reveal>

            <Reveal animation="bounce" delay={300}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/apps"
                  className="group flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
                >
                  Explore applications
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </Link>
                <button className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
                  <PlayCircle className="h-4 w-4" />
                  Watch overview
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="bg-white">
      <HeroSection />

      {/* ── Search bar ─────────────────────────────────────── */}
      <section className="py-6">
        <Container>
          <Reveal className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.16)] sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="home-search"
                  type="search"
                  placeholder="Search applications, categories, or developers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-4 text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
                />
              </div>
              <select
                id="home-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600 outline-none"
              >
                <option value="all">All categories</option>
                {CATEGORY_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <Link
                href={`/apps?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`}
                className="shrink-0 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 text-center"
              >
                Search
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Featured Applications — LIVE DATA ──────────────── */}
      <FeaturedAppsSection />

      {/* ── New Releases — LIVE DATA ─────────────────────── */}
      <NewReleasesSection />

      {/* ── Top Developers ──────────────────────────────────── */}
      <section className="pb-16">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Community"
              title="Top developers"
              href="/developers"
              icon={Award}
            />
          </Reveal>
          <Row>
            {TOP_DEVELOPERS.map((dev, i) => (
              <Reveal key={dev.name} delay={i * 60} className="shrink-0">
                <Card className="flex w-48 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <Mark>{dev.name.charAt(0)}</Mark>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/20">
                      {dev.badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{dev.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{dev.apps} apps</p>
                  </div>
                  <Rating rating={dev.rating} />
                </Card>
              </Reveal>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <section className="pb-16">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-neutral-900 to-neutral-800 px-8 py-12 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.5)]">
              <div className="pointer-events-none absolute -top-24 right-[-8%] h-72 w-72 rounded-full bg-white/4 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-8 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="border-l border-white/15 pl-4">
                    <p className="font-mono text-2xl font-semibold text-white sm:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Why Choose DUspace ─────────────────────────────── */}
      <section className="py-16">
        <Container>
          <Reveal>
            <div className="mb-12 max-w-lg">
              <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                Why DUspace
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Built for people who just want the right tool.
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_CHOOSE.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${item.color} text-white shadow-sm ring-1 ring-white/20 transition group-hover:scale-105`}>
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="text-xs leading-relaxed text-neutral-500">{item.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}