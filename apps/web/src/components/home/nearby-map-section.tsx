'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function NearbyMapSection() {
  const t = useTranslations('home');

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div
        style={{ height: '510px' }}
        className="relative z-10 mx-auto mt-[-200px] max-w-page rounded-3xl border border-slate-100 bg-white p-10 shadow-lg sm:px-6 lg:px-8"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="mb-8 text-lg font-bold text-ink sm:text-3xl">{t('nearbyTitle')}</h2>
          <Link
            href="/nearby"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
          >
            View all nearby
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14431.08826928405!2d51.546554699999994!3d25.278251899999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sqa!4v1780184175861!5m2!1sen!2sqa"
            width="100%"
            height="500"
            style={{ border: 0, borderRadius: '20px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="origin"
            title={t('nearbyMapAlt')}
          />
        </div>
      </div>
    </section>
  );
}
