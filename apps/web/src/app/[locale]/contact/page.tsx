import { ContactForm } from '@/components/contact/contact-form';
import { ContactHeroSection } from '@/components/contact/contact-hero-section';
import { ContactInfoSection } from '@/components/contact/contact-info-section';
import { scrollRevealProps } from '@/lib/scroll-reveal';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';
// import { MobileAppsCta } from '@/components/home/mobile-apps-cta';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function ContactPage(): Promise<JSX.Element> {
  return (
    <>
      <ContactHeroSection />

      <section {...scrollRevealProps('fade-up')} className="mt-20 pb-12 dark:bg-dm-bg sm:pb-16">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
            <div {...scrollRevealProps('fade-right')}>
              <ContactForm />
            </div>
            <div {...scrollRevealProps('fade-left', 120)}>
              <ContactInfoSection />
            </div>
          </div>
        </div>
      </section>

      {/* <MobileAppsCta /> */}
    </>
  );
}
