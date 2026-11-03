import defaultHero from "@/assets/hero-illustration.png";
import diwaliHero from "@/assets/hero-diwali.webp";
import { supabase } from "@/integrations/supabase/client";

export type LandingTheme = {
  name: string;
  eyebrow?: string;
  headline: string;
  highlight: string;
  description: string;
  primaryLabel: string;
  heroImage: string;
  heroAlt: string;
  festive?: boolean;
};

// Add future campaigns here, then point VITE_LANDING_THEME at their key.
export const landingThemes: Record<string, LandingTheme> = {
  default: {
    name: "Everyday",
    headline: "Dine Local.",
    highlight: "Save More.",
    description: "Pay at your favorite restaurants through DineDeal and get instant discounts, cashback, and exclusive rewards.",
    primaryLabel: "Start Saving Now",
    heroImage: defaultHero,
    heroAlt: "Dining and savings with DineDeal",
  },
  diwali: {
    name: "Diwali",
    eyebrow: "Celebrate the festival of lights",
    headline: "Light up your celebrations.",
    highlight: "Dine local. Save more.",
    description: "Gather around great food this Diwali. Discover local restaurants and enjoy DineDeal savings when you pay.",
    primaryLabel: "Explore Festive Dining",
    heroImage: diwaliHero,
    heroAlt: "A festive dining illustration with DineDeal savings",
    festive: true,
  },
};

export function getLandingTheme(key?: string): LandingTheme {
  return landingThemes[key || import.meta.env.VITE_LANDING_THEME || "diwali"] || landingThemes.default;
}

export async function loadLandingTheme(): Promise<LandingTheme> {
  const preview = new URLSearchParams(window.location.search).get("theme");
  if (preview && landingThemes[preview]) return landingThemes[preview];

  const { data: setting } = await (supabase.from("landing_settings" as any) as any)
    .select("active_theme,starts_at,ends_at").eq("id", 1).maybeSingle();
  if (setting) {
    const now = Date.now();
    const started = !setting.starts_at || Date.parse(setting.starts_at) <= now;
    const active = !setting.ends_at || Date.parse(setting.ends_at) > now;
    return getLandingTheme(started && active ? setting.active_theme : "default");
  }

  try {
    const url = import.meta.env.VITE_LANDING_CONFIG_URL || "/landing-theme.json";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Theme config: ${response.status}`);
    const config: { activeTheme?: string } = await response.json();
    if (config.activeTheme && landingThemes[config.activeTheme]) {
      return landingThemes[config.activeTheme];
    }
  } catch (error) {
    console.warn("Using bundled landing theme", error);
  }
  return getLandingTheme();
}
