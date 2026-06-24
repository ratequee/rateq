'use client';

import { BlogCoverUpload } from '@/components/blog/blog-cover-upload';
import { BlogRichTextEditor } from '@/components/blog/blog-rich-text-editor';
import { hasMeaningfulBlogContent } from '@/components/blog/blog-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { adminBlogApi } from '@/lib/admin-blog-api';
import { ApiError } from '@/lib/api';
import type {
  BlogLocale,
  BlogPostAdmin,
  BlogPostTranslationInput,
  BlogPostTranslationPublic,
} from '@rateq/types';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type TranslationForm = Record<
  BlogLocale,
  {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  }
>;

const EMPTY_TRANSLATION = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
};

function emptyTranslations(): TranslationForm {
  return {
    en: { ...EMPTY_TRANSLATION },
    ar: { ...EMPTY_TRANSLATION },
  };
}

function fromAdminPost(post: BlogPostAdmin): {
  status: 'draft' | 'published';
  coverUrl: string;
  translations: TranslationForm;
} {
  const translations = emptyTranslations();

  for (const item of post.translations) {
    translations[item.locale] = {
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? '',
      content: item.content,
      metaTitle: item.metaTitle ?? '',
      metaDescription: item.metaDescription ?? '',
    };
  }

  return {
    status: post.status,
    coverUrl: post.coverUrl ?? '',
    translations,
  };
}

export default function AdminBlogPage() {
  const t = useTranslations('adminBlog');
  const [posts, setPosts] = useState<BlogPostAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<BlogLocale>('en');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverUrl, setCoverUrl] = useState('');
  const [translations, setTranslations] = useState<TranslationForm>(emptyTranslations());

  useRequireFirebaseAdmin();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminBlogApi.list({ limit: 50 });
      setPosts(response.data);
    } catch {
      toast.error(t('loadError'));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const resetForm = () => {
    setEditingId(null);
    setStatus('draft');
    setCoverUrl('');
    setTranslations(emptyTranslations());
    setActiveLocale('en');
  };

  const startCreate = () => {
    resetForm();
  };

  const startEdit = (post: BlogPostAdmin) => {
    const parsed = fromAdminPost(post);
    setEditingId(post.id);
    setStatus(parsed.status);
    setCoverUrl(parsed.coverUrl);
    setTranslations(parsed.translations);
    setActiveLocale('en');
  };

  const updateTranslationField = (
    locale: BlogLocale,
    field: keyof TranslationForm[BlogLocale],
    value: string,
  ) => {
    setTranslations((current) => ({
      ...current,
      [locale]: {
        ...current[locale],
        [field]: value,
      },
    }));
  };

  const buildTranslationPayload = (): BlogPostTranslationInput[] => {
    const payload: BlogPostTranslationInput[] = [];

    for (const locale of ['en', 'ar'] as BlogLocale[]) {
      const item = translations[locale];
      if (!item.title.trim() && !item.content.trim()) continue;

      if (item.title.trim() && !hasMeaningfulBlogContent(item.content)) {
        throw new Error(t('contentTooShort'));
      }

      payload.push({
        locale,
        title: item.title.trim(),
        slug: item.slug.trim() || undefined,
        excerpt: item.excerpt.trim() || undefined,
        content: item.content.trim(),
        metaTitle: item.metaTitle.trim() || undefined,
        metaDescription: item.metaDescription.trim() || undefined,
      });
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let translationPayload: BlogPostTranslationInput[];

    try {
      translationPayload = buildTranslationPayload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('contentTooShort'));
      return;
    }

    if (translationPayload.length === 0) {
      toast.error(t('translationRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        status,
        coverUrl: coverUrl.trim() || null,
        translations: translationPayload,
      };

      if (editingId) {
        await adminBlogApi.update(editingId, body);
        toast.success(t('updated'));
      } else {
        await adminBlogApi.create(body);
        toast.success(t('created'));
      }

      resetForm();
      await loadPosts();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    setDeletingId(id);
    try {
      await adminBlogApi.remove(id);
      if (editingId === id) resetForm();
      await loadPosts();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const current = translations[activeLocale] ?? EMPTY_TRANSLATION;

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
          </div>
          <Button type="button" className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            {t('newPost')}
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">
              {editingId ? t('editPost') : t('createPost')}
            </h2>
            {editingId ? (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                {t('cancelEdit')}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('statusLabel')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="draft">{t('statusDraft')}</option>
                <option value="published">{t('statusPublished')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('coverLabel')}</label>
              <BlogCoverUpload
                value={coverUrl}
                onChange={setCoverUrl}
                labels={{
                  upload: t('coverUpload'),
                  remove: t('coverRemove'),
                  hint: t('coverHint'),
                  uploadError: t('coverUploadError'),
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-100 pb-2">
            {(['en', 'ar'] as BlogLocale[]).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeLocale === locale
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-ink-muted hover:bg-slate-200'
                }`}
              >
                {locale === 'en' ? t('englishTab') : t('arabicTab')}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('titleLabel')}</label>
              <Input
                value={current.title}
                onChange={(e) => updateTranslationField(activeLocale, 'title', e.target.value)}
                placeholder={t('titlePlaceholder')}
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('slugLabel')}</label>
              <Input
                value={current.slug}
                onChange={(e) => updateTranslationField(activeLocale, 'slug', e.target.value)}
                placeholder={t('slugPlaceholder')}
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('excerptLabel')}
              </label>
              <textarea
                value={current.excerpt}
                onChange={(e) => updateTranslationField(activeLocale, 'excerpt', e.target.value)}
                placeholder={t('excerptPlaceholder')}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('contentLabel')}
              </label>
              <BlogRichTextEditor
                key={activeLocale}
                value={current.content}
                onChange={(html) => updateTranslationField(activeLocale, 'content', html)}
                placeholder={t('contentPlaceholder')}
                dir={activeLocale === 'ar' ? 'rtl' : 'ltr'}
                labels={{
                  bold: t('editorBold'),
                  italic: t('editorItalic'),
                  underline: t('editorUnderline'),
                  heading: t('editorHeading'),
                  bulletList: t('editorBulletList'),
                  orderedList: t('editorOrderedList'),
                  quote: t('editorQuote'),
                  alignLeft: t('editorAlignLeft'),
                  alignCenter: t('editorAlignCenter'),
                  alignRight: t('editorAlignRight'),
                  link: t('editorLink'),
                  linkPrompt: t('editorLinkPrompt'),
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('metaTitleLabel')}
                </label>
                <Input
                  value={current.metaTitle}
                  onChange={(e) =>
                    updateTranslationField(activeLocale, 'metaTitle', e.target.value)
                  }
                  placeholder={t('metaTitlePlaceholder')}
                  className="h-11"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('metaDescriptionLabel')}
                </label>
                <Input
                  value={current.metaDescription}
                  onChange={(e) =>
                    updateTranslationField(activeLocale, 'metaDescription', e.target.value)
                  }
                  placeholder={t('metaDescriptionPlaceholder')}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editingId ? t('saveChanges') : t('publishPost')}
          </Button>
        </form>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : posts.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">{t('empty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {posts.map((post) => {
                const en = post.translations.find(
                  (item: BlogPostTranslationPublic) => item.locale === 'en',
                );
                const ar = post.translations.find(
                  (item: BlogPostTranslationPublic) => item.locale === 'ar',
                );

                return (
                  <li key={post.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {en?.title ?? ar?.title ?? t('untitled')}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {t('statusBadge', { status: post.status })}
                        {en ? ` · EN: ${en.slug}` : ''}
                        {ar ? ` · AR: ${ar.slug}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => startEdit(post)}
                      >
                        <Pencil className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-600 hover:bg-red-50"
                        disabled={deletingId === post.id}
                        onClick={() => void handleDelete(post.id)}
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {t('remove')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
