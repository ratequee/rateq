'use client';

import { ShareLinkButton } from '@/components/ui/share-link-button';

interface CompanyShareButtonProps {
  slug: string;
  companyName: string;
}

export function CompanyShareButton({ slug, companyName }: CompanyShareButtonProps) {
  return <ShareLinkButton path={`/companies/${slug}`} name={companyName} />;
}
