import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Car,
  Dumbbell,
  Gem,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  LayoutGrid,
  Plane,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';

const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  business: Briefcase,
  'business-services': Briefcase,
  automotive: Car,
  luxury: Gem,
  'luxury-goods': Gem,
  health: HeartPulse,
  healthcare: HeartPulse,
  realestate: Home,
  'real-estate': Home,
  technology: Laptop,
  retail: ShoppingBag,
  dining: UtensilsCrossed,
  'dining-restaurants': UtensilsCrossed,
  education: GraduationCap,
  finance: Wallet,
  travel: Plane,
  fitness: Dumbbell,
};

export function getCategoryIcon(slug: string): LucideIcon {
  if (SLUG_ICON_MAP[slug]) return SLUG_ICON_MAP[slug];

  const baseSlug = slug.split('-')[0] ?? slug;
  if (baseSlug && SLUG_ICON_MAP[baseSlug]) return SLUG_ICON_MAP[baseSlug]!;

  return LayoutGrid;
}
