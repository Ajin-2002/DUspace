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
} from "lucide-react";
import Container from "@/components/layout/container";
import { cn } from "@/lib/utils";

// Dummy Data
const INSTALLED_APPS = [
  {
    name: "CodeFlow",
    developer: "ByteWorks",
    category: "Productivity",
    rating: 4.8,
    downloads: "2.1M",
    icon: "⚡",
    status: "active",
    lastUsed: "2 hours ago",
    version: "v3.2.1",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
  {
    name: "PixelPro",
    developer: "DesignLab",
    category: "Design",
    rating: 4.6,
    downloads: "890K",
    icon: "🎨",
    status: "active",
    lastUsed: "1 day ago",
    version: "v2.5.0",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
  {
    name: "DataSync",
    developer: "CloudBase",
    category: "Utilities",
    rating: 4.5,
    downloads: "1.4M",
    icon: "🔄",
    status: "inactive",
    lastUsed: "5 days ago",
    version: "v1.8.3",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
  {
    name: "TaskFlow",
    developer: "Productivity Labs",
    category: "Productivity",
    rating: 4.7,
    downloads: "3.2M",
    icon: "📋",
    status: "active",
    lastUsed: "3 hours ago",
    version: "v4.0.2",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
];

const DOWNLOADED_APPS = [
  {
    name: "AI Writer Pro",
    developer: "NeuralTech",
    category: "AI & ML",
    rating: 4.9,
    downloads: "3.4M",
    icon: "🤖",
    status: "downloading",
    progress: 65,
    size: "245 MB",
    time: "2 min left"
  },
  {
    name: "Cloud Studio",
    developer: "CloudWorks",
    category: "Development",
    rating: 4.7,
    downloads: "1.8M",
    icon: "☁️",
    status: "completed",
    progress: 100,
    size: "512 MB",
    time: "Completed"
  },
  {
    name: "Design System Pro",
    developer: "DesignOps",
    category: "Design",
    rating: 4.8,
    downloads: "2.2M",
    icon: "🎯",
    status: "paused",
    progress: 45,
    size: "380 MB",
    time: "15 min left"
  },
];

const FAVORITES = [
  {
    name: "Data Analytics",
    developer: "DataInsight",
    category: "Analytics",
    rating: 4.6,
    downloads: "1.5M",
    icon: "📊",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
  {
    name: "Cloud Security",
    developer: "SecureCloud",
    category: "Security",
    rating: 4.9,
    downloads: "2.8M",
    icon: "🔒",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
  {
    name: "AI Assistant",
    developer: "IntelligenceAI",
    category: "AI & ML",
    rating: 4.7,
    downloads: "4.1M",
    icon: "🧠",
    bg: "bg-neutral-100",
    textColor: "text-neutral-700"
  },
];

const REVIEWS = [
  { app: "CodeFlow", user: "Alex M.", rating: 5, comment: "Best development tool I've ever used!", time: "2 days ago" },
  { app: "PixelPro", user: "Sarah J.", rating: 4, comment: "Great design app, but needs more templates.", time: "4 days ago" },
  { app: "DataSync", user: "Mike R.", rating: 5, comment: "Perfect for team collaboration.", time: "1 week ago" },
  { app: "TaskFlow", user: "Emily K.", rating: 4, comment: "Good productivity app, clean interface.", time: "2 weeks ago" },
];

const BILLING_HISTORY = [
  { id: 1, plan: "Pro Annual", amount: "$99.00", date: "Dec 15, 2024", status: "paid" },
  { id: 2, plan: "Pro Annual", amount: "$99.00", date: "Dec 15, 2023", status: "paid" },
  { id: 3, plan: "Pro Annual", amount: "$99.00", date: "Dec 15, 2022", status: "paid" },
  { id: 4, plan: "Pro Annual", amount: "$99.00", date: "Dec 15, 2021", status: "paid" },
];

const SETTINGS_SECTIONS = [
  { icon: User, label: "Profile", description: "Manage your personal information" },
  { icon: Shield, label: "Security", description: "Password, 2FA, and security settings" },
  { icon: Bell, label: "Notifications", description: "Choose what you want to be notified about" },
  { icon: CreditCard, label: "Billing", description: "Payment methods and subscription plans" },
  { icon: Globe, label: "Preferences", description: "Language, region, and display preferences" },
  { icon: Lock, label: "Privacy", description: "Privacy controls and data management" },
];

const SUPPORT_TICKETS = [
  { id: 1, subject: "App not opening", status: "open", priority: "high", date: "2 hours ago" },
  { id: 2, subject: "Billing issue", status: "in-progress", priority: "medium", date: "1 day ago" },
  { id: 3, subject: "Feature request", status: "closed", priority: "low", date: "3 days ago" },
];

const ACTIVITY_TIMELINE = [
  { action: "Installed CodeFlow v3.2.1", time: "2 hours ago", icon: "⚡", type: "install" },
  { action: "Reviewed PixelPro - 5 stars", time: "1 day ago", icon: "⭐", type: "review" },
  { action: "Added DataSync to wishlist", time: "3 days ago", icon: "❤️", type: "wishlist" },
  { action: "Updated TaskFlow settings", time: "5 days ago", icon: "⚙️", type: "settings" },
  { action: "Shared CodeFlow with team", time: "1 week ago", icon: "👥", type: "share" },
  { action: "Downloaded AI Writer Pro", time: "2 weeks ago", icon: "📥", type: "download" },
];

export function UserDashboard() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "my-apps", icon: FolderOpen, label: "My Apps", count: 12 },
    { id: "downloads", icon: Download, label: "Downloads", count: 3 },
    { id: "favorites", icon: Heart, label: "Favorites", count: 24 },
    { id: "reviews", icon: Star, label: "Reviews", count: 7 },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "billing", icon: CreditCard, label: "Billing" },
    { id: "support", icon: LifeBuoy, label: "Support" },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "my-apps":
        return <MyAppsSection />;
      case "downloads":
        return <DownloadsSection />;
      case "favorites":
        return <FavoritesSection />;
      case "reviews":
        return <ReviewsSection />;
      case "settings":
        return <SettingsSection />;
      case "billing":
        return <BillingSection />;
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
                Welcome back!
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {session?.user?.name || "User"}
              </h1>
              <p className="mt-1 text-sm text-neutral-300">
                You have 12 apps installed and 7 reviews written
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30">
                <Download className="h-4 w-4" />
                Browse Store
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30">
                <MessageSquare className="h-4 w-4" />
                Write Review
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Apps Installed", value: "12", change: "+2 this month" },
              { label: "Reviews Written", value: "7", change: "4.8 avg rating" },
              { label: "Wishlist Items", value: "24", change: "+5 this week" },
              { label: "Total Downloads", value: "156", change: "↑ 12%" },
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
            { label: "Apps Installed", value: "12", icon: Package, change: "+2 this month" },
            { label: "Reviews Written", value: "7", icon: Star, change: "4.8 avg rating" },
            { label: "Wishlist Items", value: "24", icon: Heart, change: "+5 this week" },
            { label: "Total Downloads", value: "156", icon: Download, change: "↑ 12%" },
            { label: "Storage Used", value: "4.2GB", icon: Cloud, change: "of 10GB" },
            { label: "App Usage", value: "47h", icon: Clock, change: "+8h this week" },
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
            {ACTIVITY_TIMELINE.slice(0, 5).map((activity, index) => (
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">My Apps</h2>
          <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            <Plus className="h-4 w-4" />
            Install New App
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSTALLED_APPS.map((app) => (
            <div
              key={app.name}
              className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-2xl", app.bg)}>
                    {app.icon}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{app.name}</p>
                    <p className="text-xs text-neutral-500">{app.developer}</p>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  app.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-neutral-100 text-neutral-600"
                )}>
                  {app.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {app.rating}
                </span>
                <span>{app.downloads} downloads</span>
                <span>v{app.version}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className="text-xs text-neutral-400">{app.lastUsed}</span>
                <button className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Downloads Section
  function DownloadsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Downloads</h2>
          <div className="flex gap-2">
            <button className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50">
              <Filter className="inline h-4 w-4 mr-1" />
              Filter
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {DOWNLOADED_APPS.map((app) => (
            <div
              key={app.name}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
                  {app.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{app.name}</p>
                      <p className="text-xs text-neutral-500">{app.developer}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      app.status === "completed" ? "text-emerald-600" :
                        app.status === "downloading" ? "text-neutral-700" :
                          "text-amber-600"
                    )}>
                      {app.status === "completed" ? "✓ Completed" :
                        app.status === "downloading" ? "Downloading..." :
                          "Paused"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{app.size}</span>
                      <span>{app.time}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-neutral-900 transition-all"
                        style={{ width: `${app.progress}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-end">
                      <span className="text-xs font-medium text-neutral-700">{app.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Favorites Section
  function FavoritesSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Favorites</h2>
          <span className="text-sm text-neutral-500">24 items</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FAVORITES.map((app) => (
            <div
              key={app.name}
              className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-2xl", app.bg)}>
                  {app.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{app.name}</p>
                  <p className="text-xs text-neutral-500">{app.developer}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {app.rating}
                    </span>
                    <span>{app.downloads}</span>
                  </div>
                </div>
              </div>
              <button className="mt-3 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
                Install Now
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reviews Section
  function ReviewsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">My Reviews</h2>
          <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            <Plus className="h-4 w-4" />
            Write Review
          </button>
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
                  Edit
                </button>
                <button className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200">
                  Delete
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

  // Billing Section
  function BillingSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Billing</h2>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
            Upgrade Plan
          </button>
        </div>

        {/* Current Plan */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Current Plan</p>
              <p className="text-2xl font-bold text-neutral-900">Pro Annual</p>
              <p className="text-sm text-neutral-600">$99.00/year · Renews Dec 15, 2025</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Active
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-neutral-900">Billing History</h3>
          <div className="space-y-3">
            {BILLING_HISTORY.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-neutral-900">{bill.plan}</p>
                  <p className="text-xs text-neutral-500">{bill.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-neutral-900">{bill.amount}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {bill.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

        {/* Quick Help */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "FAQ", icon: HelpCircle, color: "bg-neutral-100 text-neutral-700" },
            { label: "Documentation", icon: Book, color: "bg-neutral-100 text-neutral-700" },
            { label: "Contact Us", icon: MessageSquare, color: "bg-neutral-100 text-neutral-700" },
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

        {/* Support Tickets */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-neutral-900">My Tickets</h3>
          <div className="space-y-3">
            {SUPPORT_TICKETS.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-neutral-900">{ticket.subject}</p>
                  <p className="text-xs text-neutral-500">{ticket.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    ticket.priority === "high" ? "bg-red-100 text-red-700" :
                      ticket.priority === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-neutral-100 text-neutral-700"
                  )}>
                    {ticket.priority}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    ticket.status === "open" ? "bg-red-100 text-red-700" :
                      ticket.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                  )}>
                    {ticket.status}
                  </span>
                </div>
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
                {item.count && (
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
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-neutral-600">Pro Plan</p>
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
                {session?.user?.name?.charAt(0) || "U"}
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