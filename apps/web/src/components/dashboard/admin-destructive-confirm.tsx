'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminDestructiveConfirmProps {
  open: boolean;
  title: string;
  description: string;
  bullets?: string[];
  irreversibleLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Modal confirm for irreversible admin deletes (replaces weak window.confirm). */
export function AdminDestructiveConfirm({
  open,
  title,
  description,
  bullets,
  irreversibleLabel,
  confirmLabel,
  cancelLabel,
  busy,
  onCancel,
  onConfirm,
}: AdminDestructiveConfirmProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-destructive-title"
        aria-describedby="admin-destructive-desc"
        className={cn(
          'w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl',
          'dark:border-red-900/60 dark:bg-dm-surface',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="admin-destructive-title"
          className="text-lg font-semibold text-red-700 dark:text-red-300"
        >
          {title}
        </h3>
        <p id="admin-destructive-desc" className="mt-2 text-sm text-secondary">
          {description}
        </p>
        {bullets && bullets.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink dark:text-slate-100">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
          {irreversibleLabel}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
