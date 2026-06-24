'use client';

import { Button } from '@/components/ui/button';
import { uploadBlogCoverImage } from '@/lib/blog-upload';
import { getFirebaseStorageErrorMessage } from '@/lib/firebase/errors';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface BlogCoverUploadProps {
  value: string;
  onChange: (url: string) => void;
  labels: {
    upload: string;
    remove: string;
    hint: string;
    uploadError: string;
  };
}

export function BlogCoverUpload({ value, onChange, labels }: BlogCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadBlogCoverImage(file);
      onChange(url);
    } catch (error) {
      toast.error(getFirebaseStorageErrorMessage(error, labels.uploadError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <img src={value} alt="" className="aspect-[16/9] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute end-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-white"
            aria-label={labels.remove}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-ink-muted transition hover:border-brand-500 hover:bg-brand-50/40 hover:text-brand-600"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          {labels.upload}
        </button>
      )}

      <p className="text-xs text-ink-muted">{labels.hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
