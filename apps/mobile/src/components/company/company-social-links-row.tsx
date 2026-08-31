import type { CompanySocialLinks } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';

interface SocialLinkConfig {
  key: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface CompanySocialLinksRowProps {
  socialLinks: CompanySocialLinks;
}

function normalizeUrl(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}

function buildSocialLinks(socialLinks: CompanySocialLinks): SocialLinkConfig[] {
  const links: SocialLinkConfig[] = [];

  if (socialLinks.whatsappNumber) {
    links.push({
      key: 'whatsapp',
      href: `https://wa.me/${socialLinks.whatsappNumber.replace(/\D/g, '')}`,
      icon: 'logo-whatsapp',
      color: '#25D366',
    });
  }
  if (socialLinks.instagramUrl) {
    links.push({
      key: 'instagram',
      href: normalizeUrl(socialLinks.instagramUrl),
      icon: 'logo-instagram',
      color: '#E4405F',
    });
  }
  if (socialLinks.youtubeUrl) {
    links.push({
      key: 'youtube',
      href: normalizeUrl(socialLinks.youtubeUrl),
      icon: 'logo-youtube',
      color: '#FF0000',
    });
  }
  if (socialLinks.facebookUrl) {
    links.push({
      key: 'facebook',
      href: normalizeUrl(socialLinks.facebookUrl),
      icon: 'logo-facebook',
      color: '#1877F2',
    });
  }
  if (socialLinks.linkedinUrl) {
    links.push({
      key: 'linkedin',
      href: normalizeUrl(socialLinks.linkedinUrl),
      icon: 'logo-linkedin',
      color: '#0A66C2',
    });
  }
  if (socialLinks.twitterUrl) {
    links.push({
      key: 'twitter',
      href: normalizeUrl(socialLinks.twitterUrl),
      icon: 'logo-twitter',
      color: '#1DA1F2',
    });
  }

  return links;
}

export function CompanySocialLinksRow({ socialLinks }: CompanySocialLinksRowProps) {
  const links = buildSocialLinks(socialLinks);

  if (links.length === 0) return null;

  return (
    <View className="mt-4 flex-row flex-wrap items-center justify-center gap-3">
      {links.map((link) => (
        <Pressable
          key={link.key}
          onPress={() => void Linking.openURL(link.href)}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated"
          accessibilityRole="link"
        >
          <Ionicons name={link.icon} size={20} color={link.color} />
        </Pressable>
      ))}
    </View>
  );
}
