'use client';

import { Button } from '@/components/ui/button';
import { uploadCategoryIcon } from '@/lib/category-icon-upload';
import { getFirebaseStorageErrorMessage } from '@/lib/firebase/errors';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface CategoryIconUploadProps {
  value: string;
  onChange: (url: string) => void;
  labels: {
    upload: string;
    remove: string;
    hint: string;
    uploadError: string;
  };
}

export function CategoryIconUpload({ value, onChange, labels }: CategoryIconUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadCategoryIcon(file);
      onChange(url);
    } catch (error) {
      toast.error(getFirebaseStorageErrorMessage(error, labels.uploadError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className="h-20 w-20 rounded-xl border border-subtle bg-white object-contain p-2 dark:bg-dm-elevated"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -end-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-slate-50 dark:bg-dm-elevated dark:text-white"
            aria-label={labels.remove}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-ink-muted transition hover:border-brand-500 hover:bg-brand-50/40 hover:text-brand-600 dark:border-dm-border dark:bg-dm-elevated dark:text-slate-400 dark:hover:border-brand-400 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="px-1 text-center leading-tight">{labels.upload}</span>
        </button>
      )}

      <p className="text-xs text-secondary">{labels.hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      {value ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {labels.upload}
        </Button>
      ) : null}
    </div>
  );
}
