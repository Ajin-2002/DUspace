export type TemplateCategory = "dashboard" | "navigation" | "component" | "forms" | "settings" | "dialogs" | "profile" | "landing";
export type DesignTarget = "page" | "navigation" | "component" | "form" | "dialog";
export type CompatibilityLevel = "full" | "partial" | "unsupported";
export type DesignConfiguration = { accent?: "graphite" | "blue" | "violet"; density?: "comfortable" | "compact" };

export interface DesignTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  version: number;
  frameworks: string[];
  stylingSystems: string[];
  supportedComponentTypes: DesignTarget[];
  requiredDependencies: string[];
  configurableProperties: {
    accent: { type: "enum"; values: Array<DesignConfiguration["accent"]> };
    density: { type: "enum"; values: Array<DesignConfiguration["density"]> };
  };
  responsive: boolean;
  accessibility: string[];
  tags: string[];
  status: "published";
  createdAt: string;
  updatedAt: string;
}

const webFrameworks = ["React", "Next.js"];
const supportedStyles = ["Tailwind CSS", "CSS", "CSS Modules", "Sass", "Styled Components"];
const targetsByCategory: Record<TemplateCategory, DesignTarget[]> = {
  dashboard: ["page"], navigation: ["navigation"], component: ["component"], forms: ["form"], settings: ["page", "component"], dialogs: ["dialog"], profile: ["component"], landing: ["page"],
};

function template(
  id: string,
  name: string,
  description: string,
  category: TemplateCategory,
  tags: string[],
): DesignTemplate {
  return {
    id, slug: id, name, description, category, version: 1,
    frameworks: webFrameworks,
    stylingSystems: supportedStyles,
    supportedComponentTypes: targetsByCategory[category],
    requiredDependencies: ["react", "lucide-react"],
    configurableProperties: {
      accent: { type: "enum", values: ["graphite", "blue", "violet"] },
      density: { type: "enum", values: ["comfortable", "compact"] },
    },
    responsive: true,
    accessibility: ["Semantic HTML", "Keyboard reachable controls", "Visible focus states"],
    tags,
    status: "published",
    createdAt: "2026-10-21T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
  };
}

export const designTemplates: DesignTemplate[] = [
  template("minimal-dashboard", "Minimal dashboard", "A focused workspace with a compact sidebar, clear metrics and a short activity feed.", "dashboard", ["minimal", "workspace", "overview"]),
  template("analytics-dashboard", "Analytics dashboard", "A data-led overview with trend panels, channel breakdowns and recent activity.", "dashboard", ["analytics", "charts", "metrics"]),
  template("developer-dashboard", "Developer project dashboard", "A project-centric view for releases, health signals and recent workspace activity.", "dashboard", ["developer", "projects", "releases"]),
  template("user-dashboard", "User dashboard", "A personal home for saved apps, recent activity and useful account shortcuts.", "dashboard", ["user", "personal", "apps"]),
  template("top-navigation", "Top navigation bar", "A restrained horizontal header with brand, primary links, search and account actions.", "navigation", ["header", "navbar", "top"]),
  template("collapsible-sidebar", "Collapsible desktop sidebar", "A compact icon rail that expands on hover or keyboard focus for workspace navigation.", "navigation", ["sidebar", "desktop", "collapsible"]),
  template("mobile-navigation", "Responsive mobile navigation", "A touch-friendly bottom navigation pattern with clear active and notification states.", "navigation", ["mobile", "responsive", "touch"]),
  template("statistics-cards", "Statistics cards", "A flexible set of compact KPI cards with trend context and accessible labels.", "component", ["stats", "cards", "metrics"]),
  template("data-table", "Data table", "A clean, scannable table with status, owner, date and row actions.", "component", ["table", "data", "list"]),
  template("form-layout", "Form layout", "A calm two-column form with grouped fields, guidance and clear save actions.", "forms", ["form", "inputs", "settings"]),
  template("search-filter-toolbar", "Search and filter toolbar", "A responsive search, status filter and sort row for dense workspace lists.", "component", ["search", "filters", "toolbar"]),
  template("settings-panel", "Settings panel", "A grouped settings view with descriptive controls and account-level preferences.", "settings", ["settings", "preferences", "account"]),
  template("confirmation-dialog", "Confirmation dialog", "A focused confirmation modal with clear consequence, cancel and primary actions.", "dialogs", ["modal", "confirmation", "dialog"]),
  template("profile-section", "Profile section", "A compact identity panel with avatar, account details and clear profile actions.", "profile", ["profile", "identity", "account"]),
  template("landing-hero", "Landing page hero", "A clear product introduction with one primary action, supporting copy and proof points.", "landing", ["landing", "hero", "marketing"]),
];

export function findTemplate(id: string): DesignTemplate | undefined {
  return designTemplates.find((item) => item.id === id);
}

export function filterTemplates(filters: { search?: string; category?: string; framework?: string; stylingSystem?: string }): DesignTemplate[] {
  const query = filters.search?.trim().toLowerCase();
  return designTemplates.filter((item) => {
    const searchable = [item.name, item.description, item.category, ...item.tags].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.framework || item.frameworks.some((value) => value.toLowerCase() === filters.framework?.toLowerCase())) &&
      (!filters.stylingSystem || item.stylingSystems.some((value) => value.toLowerCase() === filters.stylingSystem?.toLowerCase()));
  });
}

export interface BlueprintCompatibilityInput {
  summary?: { primaryFramework?: string | null };
  technologies?: Array<{ name?: string; kind?: string }>;
  dependencies?: { direct?: Array<{ name?: string }> };
  uiInventory?: { stylingSystems?: string[] };
}

export interface TemplateCompatibility {
  level: CompatibilityLevel;
  framework: string | null;
  stylingSystem: string | null;
  reasons: string[];
}

function inferFramework(blueprint?: BlueprintCompatibilityInput | null): string | null {
  if (!blueprint) return null;
  const text = [blueprint.summary?.primaryFramework ?? "", ...(blueprint.technologies ?? []).map((item) => item.name ?? ""), ...(blueprint.dependencies?.direct ?? []).map((item) => item.name ?? "")].join(" ").toLowerCase();
  if (text.includes("next")) return "Next.js";
  if (text.includes("react")) return "React";
  if (text.includes("vue") || text.includes("nuxt")) return "Vue";
  if (text.includes("angular")) return "Angular";
  if (text.includes("svelte")) return "Svelte";
  if (text.includes("ember")) return "Ember";
  if (text.includes("solid")) return "Solid";
  return blueprint.summary?.primaryFramework?.trim() || null;
}

function inferStylingSystem(blueprint?: BlueprintCompatibilityInput | null): string | null {
  const systems = blueprint?.uiInventory?.stylingSystems ?? [];
  if (!systems.length) return null;
  const normalized = systems.join(" ").toLowerCase();
  if (normalized.includes("tailwind")) return "Tailwind CSS";
  if (normalized.includes("styled-components") || normalized.includes("styled components")) return "Styled Components";
  if (normalized.includes("sass") || normalized.includes("scss")) return "Sass";
  if (normalized.includes("module")) return "CSS Modules";
  if (normalized.includes("css")) return "CSS";
  return systems[0];
}

export function evaluateCompatibility(item: DesignTemplate, blueprint?: BlueprintCompatibilityInput | null): TemplateCompatibility {
  const framework = inferFramework(blueprint);
  const stylingSystem = inferStylingSystem(blueprint);
  if (!blueprint) return { level: "partial", framework: null, stylingSystem: null, reasons: ["Project analysis is not available yet; framework and styling compatibility are unverified."] };
  if (!framework) return { level: "partial", framework: null, stylingSystem, reasons: ["The analyzer could not identify a framework, so compatibility is unverified."] };
  if (!item.frameworks.some((value) => value.toLowerCase() === framework.toLowerCase())) {
    return { level: "unsupported", framework, stylingSystem, reasons: [`${framework} is not supported by this template version.`] };
  }
  if (stylingSystem && !item.stylingSystems.some((value) => value.toLowerCase() === stylingSystem.toLowerCase())) {
    return { level: "unsupported", framework, stylingSystem, reasons: [`${stylingSystem} is not supported by this template version.`] };
  }
  if (!stylingSystem) return { level: "partial", framework, stylingSystem: null, reasons: [`${framework} is supported; the styling system was not detected.`] };
  return { level: "full", framework, stylingSystem, reasons: [`${framework} and ${stylingSystem} are supported.`] };
}

export function validateTemplateConfiguration(value: unknown): value is DesignConfiguration {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  if (Object.keys(config).some((key) => key !== "accent" && key !== "density")) return false;
  if (config.accent !== undefined && !["graphite", "blue", "violet"].includes(String(config.accent))) return false;
  if (config.density !== undefined && !["comfortable", "compact"].includes(String(config.density))) return false;
  return true;
}
