'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') setIndex((current) => (current > 0 ? current - 1 : current));
      if (event.key === 'ArrowRight') {
        setIndex((current) => (current < images.length - 1 ? current + 1 : current));
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, images.length, open]);

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

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                disabled={index === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex((current) => Math.max(0, current - 1));
                }}
                className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                disabled={index >= images.length - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex((current) => Math.min(images.length - 1, current + 1));
                }}
                className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <img
            src={images[index]}
            alt={alt}
            className="max-h-[90vh] max-w-[min(100%,1200px)] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[min(100%,1200px)] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
