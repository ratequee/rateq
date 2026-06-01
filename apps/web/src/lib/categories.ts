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
  Plane,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';

export const CATEGORY_IDS = [
  'business',
  'automotive',
  'luxury',
  'health',
  'realestate',
  'technology',
  'retail',
  'dining',
  'education',
  'finance',
  'travel',
  'fitness',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryDefinition {
  id: CategoryId;
  icon: LucideIcon;
  count: number;
  featured?: boolean;
  searchQuery: string;
}

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'business', icon: Briefcase, count: 42, featured: true, searchQuery: 'business' },
  { id: 'automotive', icon: Car, count: 38, featured: true, searchQuery: 'automotive' },
  { id: 'luxury', icon: Gem, count: 24, searchQuery: 'luxury' },
  { id: 'health', icon: HeartPulse, count: 56, featured: true, searchQuery: 'health' },
  { id: 'realestate', icon: Home, count: 31, searchQuery: 'real estate' },
  { id: 'technology', icon: Laptop, count: 47, featured: true, searchQuery: 'technology' },
  { id: 'retail', icon: ShoppingBag, count: 63, searchQuery: 'retail' },
  { id: 'dining', icon: UtensilsCrossed, count: 89, featured: true, searchQuery: 'restaurant' },
  { id: 'education', icon: GraduationCap, count: 19, searchQuery: 'education' },
  { id: 'finance', icon: Wallet, count: 27, searchQuery: 'finance' },
  { id: 'travel', icon: Plane, count: 15, searchQuery: 'travel' },
  { id: 'fitness', icon: Dumbbell, count: 22, searchQuery: 'fitness' },
];

export const FEATURED_CATEGORIES = CATEGORIES.filter((category) => category.featured);

export const HOME_CATEGORIES = CATEGORIES.slice(0, 8);

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function getRelatedCategories(id: CategoryId, limit = 4): CategoryDefinition[] {
  return CATEGORIES.filter((category) => category.id !== id).slice(0, limit);
}
