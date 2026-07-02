"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import {
  User,
  Package,
  Star,
  Heart,
  Download,
  TrendingUp,
  Bell,
  Search,
  Settings,
  HelpCircle,
  BarChart3,
  Clock,
  Award,
  MessageSquare,
  Share2,
  CheckCircle,
  Zap,
  Activity,
  Menu,
  ChevronDown,
  Plus,
  Filter,
  MoreVertical,
  Home,
  FolderOpen,
  Bookmark,
  CreditCard,
  LifeBuoy,
  ChevronRight,
  Cloud,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  ShoppingBag,
  Gift,
  TrendingDown,
  FileText,
  Globe,
  Shield,
  Lock,
  Play,
  Upload,
  AlertTriangle,
  Info,
  ThumbsUp,
  Users,
  Briefcase,
  Calendar,
  Camera,
  Video,
  Music,
  Book,
  Coffee,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudHail,
  Sparkles,
  GitBranch,
  Code,
  Database,
  Server,
  Cpu,
  Terminal,
  GitPullRequest,
  Bug,
  Rocket,
  Trophy,
  Target,
  Compass,
  Layers as LayersIcon,
  Grid,
  List,
  BarChart,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ArrowUpRight,
  ExternalLink,
  Edit,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import Container from "@/components/layout/container";
import { cn } from "@/lib/utils";

// Dummy Data
const DEVELOPER_APPS = [
  {
    id: 1,
    name: "TaskMaster Pro",
    tagline: "Project & task tracking for small teams",
    version: "2.4.1",
    size: "48.2 MB",
    platforms: ["macOS", "Windows", "Linux"],
    status: "live",
    installs: "12,400",
    rating: 4.7,
    revenue: "$1,240",
    icon: "📋",
    updated: "2 days ago",
    downloads: 842,
    views: 2450,
    color: "bg-blue-50",
  },
  {
    id: 2,
    name: "WeatherNow",
    tagline: "Hyperlocal forecasts with offline radar",
    version: "1.0.0",
    size: "22.6 MB",
    platforms: ["iOS", "Android"],
    status: "review",
    installs: "—",
    rating: 0,
    revenue: "—",
    icon: "🌤️",
    updated: "Submitted 3 hours ago",
    downloads: 0,
    views: 125,
    color: "bg-amber-50",
  },
  {
    id: 3,
    name: "PixelForge",
    tagline: "Lightweight sprite editor for indie devs",
    version: "0.9.2-beta",
    size: "15.1 MB",
    platforms: ["Windows", "Linux"],
    status: "draft",
    installs: "—",
    rating: 0,
    revenue: "—",
    icon: "🎮",
    updated: "Last edited 6 days ago",
    downloads: 0,
    views: 89,
    color: "bg-neutral-100",
  },
  {
    id: 4,
    name: "CloudSync Pro",
    tagline: "Real-time file synchronization across devices",
    version: "3.0.1",
    size: "65.3 MB",
    platforms: ["macOS", "Windows", "Linux", "iOS", "Android"],
    status: "live",
    installs: "8,700",
    rating: 4.9,
    revenue: "$3,450",
    icon: "☁️",
    updated: "1 day ago",
    downloads: 543,
    views: 1890,
    color: "bg-cyan-50",
  },
];

const ANALYTICS_DATA = {
  totalDownloads: "21,100",
  totalViews: "4,554",
  conversionRate: "14.2%",
  avgSession: "4m 32s",
  revenue: "$4,690",
  activeUsers: "2,847",
};

const RECENT_ACTIVITY = [
  { action: "TaskMaster Pro v2.4.1 published", time: "2 hours ago", icon: "🚀", type: "publish" },
  { action: "WeatherNow submitted for review", time: "3 hours ago", icon: "📤", type: "submit" },
  { action: "CloudSync Pro reached 8,700 installs", time: "1 day ago", icon: "📈", type: "milestone" },
  { action: "PixelForge draft updated", time: "6 days ago", icon: "✏️", type: "update" },
  { action: "New review for TaskMaster Pro", time: "1 week ago", icon: "⭐", type: "review" },
];

const REVIEWS = [
  { app: "TaskMaster Pro", user: "Alex M.", rating: 5, comment: "Best project management tool ever!", time: "2 days ago" },
  { app: "CloudSync Pro", user: "Sarah J.", rating: 5, comment: "Seamless sync across all my devices.", time: "4 days ago" },
  { app: "TaskMaster Pro", user: "Mike R.", rating: 4, comment: "Great app, but needs more integrations.", time: "1 week ago" },
];

const NOTIFICATIONS = [
  { id: 1, title: "TaskMaster Pro approved", description: "Your app has passed review and is now live", time: "1 hour ago", type: "success", read: false },
  { id: 2, title: "New review for CloudSync Pro", description: "5-star review from Sarah J.", time: "4 hours ago", type: "info", read: false },
  { id: 3, title: "WeatherNow needs changes", description: "Please update the app icon and resubmit", time: "1 day ago", type: "warning", read: true },
];

const STATUS_CONFIG = {
  live: {
    label: "Live",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700",
  },
  review: {
    label: "In review",
    icon: Clock,
    className: "bg-amber-50 text-amber-700",
  },
  draft: {
    label: "Draft",
    icon: AlertCircleIcon,
    className: "bg-neutral-100 text-neutral-600",
  },
};

export function DeveloperDashboard() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sections = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "my-apps", icon: Package, label: "My Apps", count: 4 },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "reviews", icon: Star, label: "Reviews", count: 7 },
    { id: "earnings", icon: CreditCard, label: "Earnings" },
    { id: "notifications", icon: Bell, label: "Notifications", count: NOTIFICATIONS.filter(n => !n.read).length },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "support", icon: LifeBuoy, label: "Support" },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "my-apps":
        return <MyAppsSection />;
      case "analytics":
        return <AnalyticsSection />;
      case "reviews":
        return <ReviewsSection />;
      case "earnings":
        return <EarningsSection />;
      case "notifications":
        return <NotificationsSection />;
      case "settings":
        return <SettingsSection />;
      case "support":
        return <SupportSection />;
      default:
        return <DashboardSection />;
    }
  };

  // Dashboard Section
  function DashboardSection() {
    return (
      <div className="space-y-6">
        {/* Hero Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px"
            }} />
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Developer Dashboard
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {session?.user?.name || "Developer"}
              </h1>
              <p className="mt-1 text-sm text-neutral-300">
                You have 4 published apps and 7 reviews
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30">
                <Plus className="h-4 w-4" />
                New App
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30">
                <Rocket className="h-4 w-4" />
                Publish
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Apps Live", value: "3", change: "+1 this month" },
              { label: "Total Installs", value: "21.1K", change: "+12.3%" },
              { label: "Avg Rating", value: "4.8", change: "99% positive" },
              { label: "Revenue", value: "$4,690", change: "+18% vs last month" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/70">{stat.label}</span>
                  <span className="text-xs font-medium text-emerald-300">{stat.change}</span>
                </div>
                <span className="mt-1 block text-2xl font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Published Apps", value: "4", icon: Package, change: "+1 this month" },
            { label: "Total Installs", value: "21.1K", icon: Download, change: "+12.3%" },
            { label: "Avg Rating", value: "4.8", icon: Star, change: "99% positive" },
            { label: "Revenue (30d)", value: "$4,690", icon: TrendingUp, change: "+18%" },
            { label: "Active Users", value: "2,847", icon: Users, change: "+8.2%" },
            { label: "Conversion Rate", value: "14.2%", icon: Target, change: "+2.1%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
                <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
              </div>
              <span className="mt-2 block text-2xl font-bold text-neutral-900">
                {stat.value}
              </span>
              <span className="text-xs text-neutral-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">Recent Activity</h3>
            <Clock className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">{activity.action}</p>
                  <p className="text-xs text-neutral-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // My Apps Section
  function MyAppsSection() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-neutral-900">My Apps</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-1.5 transition",
                  viewMode === "grid"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md p-1.5 transition",
                  viewMode === "list"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
              <Plus className="h-4 w-4" />
              Upload New App
            </button>
          </div>
        </div>

        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {DEVELOPER_APPS.map((app) => {
            const status = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status.icon;

            return (
              <div
                key={app.id}
                className={cn(
                  "group relative rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-lg",
                  viewMode === "list" && "flex items-center gap-6"
                )}
              >
                <div className="absolute right-3 top-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${status.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                {viewMode === "grid" ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl", app.color)}>
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900">{app.name}</h3>
                        <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{app.tagline}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                      <span className="font-mono">v{app.version}</span>
                      <span>•</span>
                      <span>{app.size}</span>
                      <span>•</span>
                      <span>{app.platforms.slice(0, 2).join(", ")}{app.platforms.length > 2 && " +"}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-2.5">
                      <div className="text-center">
                        <div className="font-mono text-sm font-semibold text-neutral-900">{app.installs}</div>
                        <div className="text-[10px] text-neutral-400">installs</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 font-mono text-sm font-semibold text-neutral-900">
                          {app.rating > 0 ? (
                            <>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {app.rating}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400">rating</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-sm font-semibold text-emerald-600">{app.revenue}</div>
                        <div className="text-[10px] text-neutral-400">revenue</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button className="flex-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700">
                        Manage
                      </button>
                      <button className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition hover:border-neutral-300 hover:text-neutral-600">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition hover:border-red-300 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {app.updated}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-1 items-center gap-4">
                      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl", app.color)}>
                        {app.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">{app.name}</h3>
                        <p className="text-xs text-neutral-500">{app.tagline}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                          <span className="font-mono">v{app.version}</span>
                          <span>{app.size}</span>
                          <span>{app.platforms.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-neutral-900">{app.installs}</div>
                        <div className="text-[10px] text-neutral-400">installs</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 font-mono text-sm font-semibold text-neutral-900">
                          {app.rating > 0 ? (
                            <>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {app.rating}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400">rating</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-emerald-600">{app.revenue}</div>
                        <div className="text-[10px] text-neutral-400">revenue</div>
                      </div>
                      <button className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700">
                        Manage
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Analytics Section
  function AnalyticsSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-neutral-900">Analytics</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Downloads", value: "21,100", change: "+12.3%", icon: Download },
            { label: "Total Views", value: "4,554", change: "+8.7%", icon: Eye },
            { label: "Conversion Rate", value: "14.2%", change: "+2.1%", icon: Target },
            { label: "Avg. Session", value: "4m 32s", change: "+15s", icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-neutral-400" />
                <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
              </div>
              <span className="mt-2 block text-2xl font-bold text-neutral-900">{stat.value}</span>
              <span className="text-xs text-neutral-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">Weekly Performance</h3>
            <BarChart3 className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex h-48 items-end gap-2">
            {[65, 78, 82, 71, 89, 94, 87].map((height, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded bg-neutral-900 transition-all hover:bg-neutral-700"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-neutral-400">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-neutral-900">Top Performing Apps</h3>
            <div className="space-y-3">
              {DEVELOPER_APPS.filter(a => a.status === "live").map((app) => (
                <div key={app.id} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{app.icon}</span>
                    <span className="text-sm font-medium text-neutral-900">{app.name}</span>
                  </div>
                  <span className="text-sm text-neutral-500">{app.installs} installs</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-neutral-900">Platform Distribution</h3>
            <div className="space-y-3">
              {[
                { platform: "Windows", percentage: 45 },
                { platform: "macOS", percentage: 30 },
                { platform: "Linux", percentage: 15 },
                { platform: "iOS", percentage: 7 },
                { platform: "Android", percentage: 3 },
              ].map((item) => (
                <div key={item.platform}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{item.platform}</span>
                    <span className="text-neutral-900">{item.percentage}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reviews Section
  function ReviewsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">App Reviews</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Avg. Rating: 4.8</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {REVIEWS.map((review, index) => (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{review.app}</p>
                  <p className="text-xs text-neutral-500">{review.user} · {review.time}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn(
                      "h-4 w-4",
                      i < review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                    )} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-neutral-700">"{review.comment}"</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200">
                  Reply
                </button>
                <button className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200">
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Earnings Section
  function EarningsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Earnings</h2>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            Withdraw Funds
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Revenue", value: "$4,690", change: "+18% vs last month" },
            { label: "This Month", value: "$1,240", change: "+12% vs last month" },
            { label: "Pending Payout", value: "$450", change: "Processing" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-neutral-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{stat.value}</p>
              <p className="mt-1 text-xs text-emerald-600">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-neutral-900">Transaction History</h3>
          <div className="space-y-3">
            {[
              { app: "TaskMaster Pro", amount: "$450", date: "Dec 15, 2024", status: "paid" },
              { app: "CloudSync Pro", amount: "$320", date: "Dec 1, 2024", status: "paid" },
              { app: "TaskMaster Pro", amount: "$380", date: "Nov 15, 2024", status: "paid" },
              { app: "CloudSync Pro", amount: "$290", date: "Nov 1, 2024", status: "pending" },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{transaction.app}</p>
                  <p className="text-xs text-neutral-500">{transaction.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-neutral-900">{transaction.amount}</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    transaction.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Notifications Section
  function NotificationsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Notifications</h2>
          <button className="text-sm text-neutral-500 transition hover:text-neutral-900">
            Mark all as read
          </button>
        </div>

        <div className="space-y-3">
          {NOTIFICATIONS.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md",
                !notification.read && "border-l-4 border-l-neutral-900"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 h-2 w-2 rounded-full",
                    !notification.read ? "bg-neutral-900" : "bg-neutral-300"
                  )} />
                  <div>
                    <p className="font-medium text-neutral-900">{notification.title}</p>
                    <p className="text-sm text-neutral-500">{notification.description}</p>
                    <p className="mt-1 text-xs text-neutral-400">{notification.time}</p>
                  </div>
                </div>
                <button className="text-neutral-400 transition hover:text-neutral-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Settings Section
  function SettingsSection() {
    const settingsSections = [
      { icon: User, label: "Profile", description: "Manage your personal information" },
      { icon: Shield, label: "Security", description: "Password, 2FA, and security settings" },
      { icon: Bell, label: "Notifications", description: "Choose what you want to be notified about" },
      { icon: CreditCard, label: "Payout Settings", description: "Payment methods and payout preferences" },
      { icon: Globe, label: "Preferences", description: "Language, region, and display preferences" },
      { icon: Lock, label: "API Keys", description: "Manage API keys for integrations" },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-neutral-900">Settings</h2>

        <div className="space-y-3">
          {settingsSections.map((section) => (
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

  // Support Section
  function SupportSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Help & Support</h2>
          <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Developer Docs", icon: Book, color: "bg-neutral-100 text-neutral-700" },
            { label: "API Reference", icon: Code, color: "bg-neutral-100 text-neutral-700" },
            { label: "Contact Support", icon: MessageSquare, color: "bg-neutral-100 text-neutral-700" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <div className={cn("rounded-full p-3", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-neutral-900">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-neutral-900">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {[
              { q: "How do I publish an app?", a: "Upload your package and fill in the app details..." },
              { q: "What platforms are supported?", a: "We support Windows, macOS, Linux, iOS, and Android..." },
              { q: "How do I earn revenue?", a: "You earn through app sales and in-app purchases..." },
            ].map((faq, index) => (
              <div key={index} className="border-b border-neutral-100 pb-3 last:border-0">
                <p className="font-medium text-neutral-900">{faq.q}</p>
                <p className="mt-1 text-sm text-neutral-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-lg">
              <span className="text-lg font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">DUspace</span>
            <span className="ml-auto text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
              Dev
            </span>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  activeSection === item.id
                    ? "bg-neutral-900 text-white shadow-lg"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  activeSection === item.id ? "text-white" : "text-neutral-500"
                )} />
                {item.label}
                {item.count && item.count > 0 && (
                  <div className={cn(
                    "ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    activeSection === item.id
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-700"
                  )}>
                    {item.count}
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-neutral-200 px-3 py-4">
            <div className="rounded-xl bg-neutral-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {session?.user?.name || "Developer"}
                  </p>
                  <p className="text-xs text-neutral-600">Developer Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white shadow-md">
                {session?.user?.name?.charAt(0) || "D"}
              </div>
            </div>
          </div>

          {/* Render Active Section */}
          {renderSection()}
        </div>
      </main>
    </div>
  );
}