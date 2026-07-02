import Link from "next/link";
import Container from "@/components/layout/container";
import {
  Search,
  PlayCircle,
  ArrowRight,
  ArrowUpRight,
  Star,
  BarChart3,
  Code2,
  LayoutGrid,
  Palette,
  Megaphone,
  GraduationCap,
  Settings,
  Puzzle,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Apple,
  Mail,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { name: "Productivity", count: 142, icon: BarChart3 },
  { name: "Design", count: 98, icon: Palette },
  { name: "Development", count: 156, icon: Code2 },
  { name: "Marketing", count: 85, icon: Megaphone },
  { name: "Education", count: 120, icon: GraduationCap },
  { name: "Utilities", count: 110, icon: Settings },
];

const FEATURED_APPS = [
  { name: "TaskFlow", category: "Productivity", rating: 4.8, price: "Free", initial: "T" },
  { name: "DesignPro", category: "Design", rating: 4.7, price: "Free", initial: "D" },
  { name: "CodeStudio", category: "Development", rating: 4.9, price: "Free", initial: "C" },
  { name: "MailMaster", category: "Marketing", rating: 4.6, price: "Free", initial: "M" },
  { name: "LearnHub", category: "Education", rating: 4.8, price: "Free", initial: "L" },
  { name: "CloudSync", category: "Utilities", rating: 4.7, price: "Free", initial: "C" },
];

const TRENDING_APPS = [
  { name: "AnalyticsPlus", rating: 4.8, initial: "A" },
  { name: "SEOBooster", rating: 4.7, initial: "S" },
  { name: "UIMate", rating: 4.6, initial: "U" },
  { name: "DataSecure", rating: 4.6, initial: "D" },
  { name: "ChatSmart", rating: 4.7, initial: "C" },
  { name: "TimeTracker", rating: 4.6, initial: "T" },
];

const NEW_RELEASES = [
  { name: "NoteX", rating: 4.6, initial: "N" },
  { name: "PixelCraft", rating: 4.7, initial: "P" },
  { name: "BuildKit", rating: 4.6, initial: "B" },
  { name: "FlowMind", rating: 4.6, initial: "F" },
  { name: "DocuGen", rating: 4.6, initial: "D" },
  { name: "Webify", rating: 4.6, initial: "W" },
];

const TOP_DEVELOPERS = [
  { name: "PixelWave", apps: 22, rating: 4.8 },
  { name: "CodeCrafters", apps: 45, rating: 4.9 },
  { name: "DevSolutions", apps: 31, rating: 4.7 },
  { name: "The App Lab", apps: 28, rating: 4.8 },
  { name: "Creative Studio", apps: 19, rating: 4.6 },
  { name: "BluePeak", apps: 33, rating: 4.8 },
];

const STATS = [
  { label: "Applications", value: "2,500+" },
  { label: "Developers", value: "15,000+" },
  { label: "Downloads", value: "1M+" },
  { label: "Countries", value: "120+" },
];

const WHY_CHOOSE = [
  { title: "Wide selection", desc: "Thousands of high-quality applications in one place.", icon: LayoutGrid },
  { title: "Secure & trusted", desc: "Every application is verified for your safety.", icon: ShieldCheck },
  { title: "Easy integration", desc: "Fits into the workflow you already have.", icon: Puzzle },
  { title: "Regular updates", desc: "Stay current with the latest features.", icon: RefreshCw },
  { title: "Dedicated support", desc: "Our team is here when you need it.", icon: Headphones },
];

/* ────────────────────────────────────────────────────────────
   SMALL COMPONENTS
──────────────────────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  href,
  cta = "View all",
}: {
  eyebrow?: string;
  title: string;
  href: string;
  cta?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h2>
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 py-1.5 pl-3.5 pr-2.5 text-sm text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
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
      className="flex gap-4 overflow-x-auto pb-2 pl-1 pr-8 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ maskImage: "linear-gradient(to right, black 92%, transparent)" }}
    >
      {children}
    </div>
  );
}

function Rating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-500">
      <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
      {rating.toFixed(1)}
    </span>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 font-mono text-xs font-medium text-white transition group-hover:scale-105">
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`group rounded-2xl border border-neutral-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ANIMATED DOTS COMPONENT - DARKER VERSION
──────────────────────────────────────────────────────────── */

function AnimatedDots() {
  // Generate random dots with unique properties
  const dots = Array.from({ length: 60 }, (_, i) => {
    const size = Math.floor(Math.random() * 6) + 2; // 2-8px
    const top = Math.random() * 100; // 0-100%
    const duration = Math.random() * 4 + 4; // 4-8s
    const delay = Math.random() * 8; // 0-8s
    const opacity = Math.random() * 0.35 + 0.3; // 0.3-0.65 (darker)
    const waveHeight = Math.random() * 20 + 5; // 5-25px

    return {
      id: i,
      size,
      top,
      duration,
      delay,
      opacity,
      waveHeight,
    };
  });

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
        const sizeClass = dot.size < 4 ? 'small' : dot.size < 6 ? 'medium' : 'large';

        return (
          <div
            key={dot.id}
            className={`dot-particle ${sizeClass}`}
            style={{
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              top: `${dot.top}%`,
              animationDuration: `${dot.duration}s`,
              animationDelay: `${dot.delay}s`,
              '--wave-height': `${dot.waveHeight}px`,
              '--dot-opacity': dot.opacity,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Gradient masks for fade in/out */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <AnimatedDots />

        {/* Subtle grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Blur effects for depth */}
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-neutral-900/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-96 w-96 rounded-full bg-neutral-900/[0.02] blur-3xl" />

        <Container>
          <div className="relative py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900/50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neutral-900" />
                </span>
                Index of 2,500+ applications
              </div>
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
                Discover the tools worth building on.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-neutral-500">
                DUspace is a curated directory of applications, vetted developers, and the
                categories that actually matter — nothing else.
              </p>
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
            </div>
          </div>
        </Container>
      </section>

      {/* ── Search bar ─────────────────────────────────────── */}
      <section className="py-6">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search applications, categories, or developers"
                className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-4 text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
              />
            </div>
            <select className="rounded-xl bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600 outline-none">
              <option>All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
            <button className="shrink-0 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700">
              Search
            </button>
          </div>
        </Container>
      </section>

      {/* ── Popular Categories ─────────────────────────────── */}
      <section className="py-16">
        <Container>
          <SectionHeader eyebrow="Browse" title="Popular categories" href="/categories" cta="View all" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} href={`/categories/${cat.name.toLowerCase()}`}>
                <Card className="flex h-full flex-col gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 transition group-hover:bg-neutral-900">
                    <cat.icon
                      className="h-5 w-5 text-neutral-500 transition group-hover:text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{cat.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{cat.count} apps</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Featured Applications ──────────────────────────── */}
      <section className="pb-16">
        <Container>
          <SectionHeader eyebrow="Selected" title="Featured applications" href="/apps?filter=featured" />
          <Row>
            {FEATURED_APPS.map((app) => (
              <Card key={app.name} className="w-52 shrink-0 p-5">
                <div className="mb-4 flex items-start justify-between">
                  <Mark>{app.initial}</Mark>
                  <Rating rating={app.rating} />
                </div>
                <p className="text-sm font-medium text-neutral-900">{app.name}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{app.category}</p>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-600">
                    {app.price}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900" />
                </div>
              </Card>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Trending Applications ──────────────────────────── */}
      <section className="pb-16">
        <Container>
          <SectionHeader eyebrow="This week" title="Trending applications" href="/apps?filter=trending" />
          <Row>
            {TRENDING_APPS.map((app) => (
              <Card key={app.name} className="flex w-40 shrink-0 flex-col gap-3 p-5">
                <Mark>{app.initial}</Mark>
                <p className="text-sm font-medium text-neutral-900">{app.name}</p>
                <Rating rating={app.rating} />
              </Card>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── New Releases ────────────────────────────────────── */}
      <section className="pb-16">
        <Container>
          <SectionHeader eyebrow="Just shipped" title="New releases" href="/apps?filter=new" />
          <Row>
            {NEW_RELEASES.map((app) => (
              <Card key={app.name} className="flex w-40 shrink-0 flex-col gap-3 p-5">
                <Mark>{app.initial}</Mark>
                <p className="text-sm font-medium text-neutral-900">{app.name}</p>
                <Rating rating={app.rating} />
              </Card>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Top Developers ──────────────────────────────────── */}
      <section className="pb-16">
        <Container>
          <SectionHeader eyebrow="Community" title="Top developers" href="/developers" />
          <Row>
            {TOP_DEVELOPERS.map((dev) => (
              <Card key={dev.name} className="flex w-48 shrink-0 flex-col gap-3 p-5">
                <Mark>{dev.name.charAt(0)}</Mark>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{dev.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{dev.apps} apps</p>
                </div>
                <Rating rating={dev.rating} />
              </Card>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <section className="pb-16">
        <Container>
          <div className="rounded-2xl bg-neutral-900 px-8 py-12">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="border-l border-white/15 pl-4">
                  <p className="font-mono text-2xl font-semibold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-neutral-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Why Choose DUspace ─────────────────────────────── */}
      <section className="py-16">
        <Container>
          <div className="mb-12 max-w-lg">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              Why DUspace
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Built for people who just want the right tool.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_CHOOSE.map((item) => (
              <Card key={item.title} className="flex flex-col gap-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 transition group-hover:bg-neutral-900">
                  <item.icon
                    className="h-5 w-5 text-neutral-500 transition group-hover:text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="text-xs leading-relaxed text-neutral-500">{item.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Download DUspace App ───────────────────────────── */}
      <section className="py-16">
        <Container>
          <div className="grid items-center gap-12 rounded-2xl border border-neutral-200 bg-neutral-50 p-10 lg:grid-cols-2 lg:p-14">
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                Mobile
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                Take the directory with you.
              </h2>
              <p className="mt-3 max-w-md text-sm text-neutral-500">
                Get the DUspace app and browse, install, and manage applications on the go.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="flex items-center gap-2.5 rounded-xl bg-neutral-900 px-5 py-2.5 text-white transition hover:bg-neutral-700">
                  <Apple className="h-4 w-4" />
                  <span className="text-left leading-tight">
                    <span className="block text-[9px] text-neutral-400">Download on the</span>
                    <span className="block text-xs font-medium">App Store</span>
                  </span>
                </button>
                <button className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-neutral-900 transition hover:border-neutral-300">
                  <PlayCircle className="h-4 w-4" />
                  <span className="text-left leading-tight">
                    <span className="block text-[9px] text-neutral-400">Get it on</span>
                    <span className="block text-xs font-medium">Google Play</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)]">
              <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
                <span className="text-xs font-medium text-neutral-900">DUspace</span>
                <span className="font-mono text-[9px] text-neutral-400">9:41</span>
              </div>
              <p className="text-sm font-medium leading-snug text-neutral-900">
                Discover the tools worth building on.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
                2,500+ applications, indexed and ready.
              </p>
              <button className="mt-5 w-full rounded-lg bg-neutral-900 py-2 text-[11px] font-medium text-white">
                Get started
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Newsletter ──────────────────────────────────────── */}
      <section className="pb-20">
        <Container>
          <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Mail className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-base font-medium text-neutral-900">Stay in the loop</p>
                <p className="mt-1 max-w-sm text-sm text-neutral-500">
                  New releases, category additions, and developer spotlights — no more than
                  twice a month.
                </p>
              </div>
            </div>
            <div className="flex w-full max-w-sm gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
              />
              <button className="shrink-0 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700">
                Subscribe
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}