import { Logo } from '@/components/brand/logo';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

export default function ComingSoonPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-brand-500">
      <div className="mx-auto flex min-h-screen max-w-page flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <Logo variant="light" />
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/en"
              className="rounded-full border border-white/30 px-4 py-2 text-white transition-colors hover:border-white hover:bg-white/10"
            >
              English
            </Link>
            <Link
              href="/ar"
              className="rounded-full border border-white/30 px-4 py-2 text-white transition-colors hover:border-white hover:bg-white/10"
            >
              العربية
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center pb-16 pt-8 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
            <Image src="/images/shield.svg" alt="" width={16} height={16} aria-hidden />
            Qatar&apos;s Trusted Review Platform
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Something <span className="text-gold-300">great</span> is coming soon
          </h1>

          <p className="mt-6 max-w-xl text-base text-white/85 sm:text-lg">
            RateQ is building a transparent way to discover trusted companies in Qatar through
            verified, community-driven reviews.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/en"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold-400 px-8 text-sm font-semibold text-white transition-colors hover:bg-gold-500"
            >
              Enter English site
            </Link>
            <Link
              href="/ar"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              الدخول بالعربية
            </Link>
          </div>

          <ul className="mt-14 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
            {[
              { icon: '/images/badge.svg', label: 'Verified Reviews' },
              { icon: '/images/users.svg', label: 'Real Experiences' },
              { icon: '/images/shield.svg', label: 'Trusted in Qatar' },
            ].map((item) => (
              <li
                key={item.label}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-5 shadow-sm"
              >
                <Image src={item.icon} alt="" width={24} height={24} aria-hidden />
                <span className="text-sm font-medium text-ink">{item.label}</span>
              </li>
            ))}
          </ul>
        </main>

        <footer className="border-t border-white/20 py-6 text-center text-sm text-white/70">
          © {new Date().getFullYear()} RateQ. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
