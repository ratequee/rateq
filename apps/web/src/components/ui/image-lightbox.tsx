'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function useLightboxLock(
  open: boolean,
  onClose: () => void,
  onPrev?: () => void,
  onNext?: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev?.();
      if (event.key === 'ArrowRight') onNext?.();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, onPrev, onNext]);
}

interface LightboxOverlayProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

function LightboxOverlay({
  open,
  onClose,
  src,
  alt,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: LightboxOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLightboxLock(open, onClose, hasPrev ? onPrev : undefined, hasNext ? onNext : undefined);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:end-6 sm:top-6"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {onPrev ? (
        <button
          type="button"
          disabled={!hasPrev}
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-30 sm:start-4"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      ) : null}

      {onNext ? (
        <button
          type="button"
          disabled={!hasNext}
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-30 sm:end-4"
          aria-label="Next image"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      ) : null}

      <img
        src={src}
        alt={alt}
        className="h-[100dvh] w-[100dvw] object-contain p-4 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

interface ImageLightboxProps {
  images: string[];
  alt?: string;
  className?: string;
  thumbnailClassName?: string;
}

export function ImageLightbox({
  images,
  alt = '',
  className,
  thumbnailClassName,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  if (images.length === 0) return null;

  const openAt = (nextIndex: number) => {
    setIndex(nextIndex);
    setOpen(true);
  };

  return (
    <>
      <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {images.map((imageUrl, imageIndex) => (
          <button
            key={`${imageUrl}-${imageIndex}`}
            type="button"
            onClick={() => openAt(imageIndex)}
            className={cn(
              'group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              thumbnailClassName,
            )}
          >
            <img src={imageUrl} alt={alt} className="h-48 w-full object-cover sm:h-56" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
              <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>

      <LightboxOverlay
        open={open}
        onClose={close}
        src={images[index] ?? ''}
        alt={alt}
        onPrev={() => setIndex((current) => Math.max(0, current - 1))}
        onNext={() => setIndex((current) => Math.min(images.length - 1, current + 1))}
        hasPrev={index > 0}
        hasNext={index < images.length - 1}
      />
    </>
  );
}

interface SingleImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export function SingleImageLightbox({
  src,
  alt = '',
  className,
  imageClassName,
}: SingleImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group relative block w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          className,
        )}
      >
        <img src={src} alt={alt} className={cn('h-full w-full object-cover', imageClassName)} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
          <ZoomIn className="h-10 w-10 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>

      <LightboxOverlay open={open} onClose={() => setOpen(false)} src={src} alt={alt} />
    </>
  );
}
