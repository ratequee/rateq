import type { Ionicons } from '@expo/vector-icons';
import { UserRole } from '@rateq/types';

export type ProfileMenuAction =
  | { type: 'route'; href: string }
  | { type: 'tab'; href: '/(tabs)/activity' | '/(tabs)/companies' }
  | { type: 'company'; slug: string }
  | { type: 'comingSoon' };

export interface ProfileMenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  action: ProfileMenuAction;
  roles: UserRole[];
}

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: 'information',
    icon: 'person-outline',
    titleKey: 'profile.menu.information',
    subtitleKey: 'profile.menu.informationSubtitle',
    action: { type: 'route', href: '/profile/information' },
    roles: [UserRole.USER, UserRole.COMPANY],
  },
  {
    id: 'myReviews',
    icon: 'star-outline',
    titleKey: 'profile.menu.myReviews',
    subtitleKey: 'profile.menu.myReviewsSubtitle',
    action: { type: 'tab', href: '/(tabs)/activity' },
    roles: [UserRole.USER],
  },
  {
    id: 'favorites',
    icon: 'heart-outline',
    titleKey: 'profile.menu.favorites',
    subtitleKey: 'profile.menu.favoritesSubtitle',
    action: { type: 'route', href: '/profile/favorites' },
    roles: [UserRole.USER],
  },
  {
    id: 'companyReviews',
    icon: 'star-outline',
    titleKey: 'profile.menu.companyReviews',
    subtitleKey: 'profile.menu.companyReviewsSubtitle',
    action: { type: 'tab', href: '/(tabs)/activity' },
    roles: [UserRole.COMPANY],
  },
  {
    id: 'projects',
    icon: 'folder-open-outline',
    titleKey: 'profile.menu.projects',
    subtitleKey: 'profile.menu.projectsSubtitle',
    action: { type: 'comingSoon' },
    roles: [UserRole.COMPANY],
  },
  {
    id: 'invitations',
    icon: 'mail-outline',
    titleKey: 'profile.menu.invitations',
    subtitleKey: 'profile.menu.invitationsSubtitle',
    action: { type: 'comingSoon' },
    roles: [UserRole.COMPANY],
  },
  {
    id: 'visitCompanies',
    icon: 'business-outline',
    titleKey: 'profile.menu.visitCompanies',
    subtitleKey: 'profile.menu.visitCompaniesSubtitle',
    action: { type: 'tab', href: '/(tabs)/companies' },
    roles: [UserRole.USER],
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    titleKey: 'profile.menu.settings',
    subtitleKey: 'profile.menu.settingsSubtitle',
    action: { type: 'route', href: '/profile/settings' },
    roles: [UserRole.USER, UserRole.COMPANY],
  },
  {
    id: 'contact',
    icon: 'call-outline',
    titleKey: 'profile.menu.contact',
    subtitleKey: 'profile.menu.contactSubtitle',
    action: { type: 'route', href: '/profile/contact' },
    roles: [UserRole.USER, UserRole.COMPANY],
  },
  {
    id: 'about',
    icon: 'information-circle-outline',
    titleKey: 'profile.menu.about',
    subtitleKey: 'profile.menu.aboutSubtitle',
    action: { type: 'route', href: '/profile/about' },
    roles: [UserRole.USER, UserRole.COMPANY],
  },
];

export function getProfileMenuItems(role: UserRole): ProfileMenuItem[] {
  return PROFILE_MENU_ITEMS.filter((item) => item.roles.includes(role));
}
