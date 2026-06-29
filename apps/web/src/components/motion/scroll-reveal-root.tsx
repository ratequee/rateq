'use client';

import { usePathname } from '@/i18n/routing';
import { useEffect, useRef, type ReactNode } from 'react';

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.06,
  rootMargin: '0px 0px -4% 0px',
};

function revealElement(element: Element) {
  element.classList.add('scroll-revealed');
}

function prepareElement(element: HTMLElement) {
  const animation = element.dataset.scrollReveal ?? 'fade-up';
  element.classList.add('scroll-reveal-pending', `scroll-reveal-${animation}`);

  const delay = element.dataset.scrollDelay;
  if (delay) {
    element.style.setProperty('--scroll-delay', `${delay}ms`);
  }
}

export function ScrollRevealRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (pathname.includes('/dashboard')) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setup = () => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      const elements = document.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
      if (elements.length === 0) return;

      if (reducedMotion) {
        elements.forEach(revealElement);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, OBSERVER_OPTIONS);

      observerRef.current = observer;

      elements.forEach((element) => {
        prepareElement(element);
        observer.observe(element);
      });
    };

    const frame = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(frame);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [pathname]);

  return children;
}
