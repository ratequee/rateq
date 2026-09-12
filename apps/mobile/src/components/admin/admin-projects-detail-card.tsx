import { AdminActionButtons } from '@/components/admin/admin-action-buttons';
import { AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { PressableFullscreenImage } from '@/components/ui/image-fullscreen-viewer';
import { getFontFamily } from '@/i18n';
import { CompanyProjectStatus, type AdminCompanyProjectListItem } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

function projectTone(status: CompanyProjectStatus): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === CompanyProjectStatus.PENDING) return 'pending';
  if (status === CompanyProjectStatus.APPROVED) return 'success';
  if (status === CompanyProjectStatus.REJECTED) return 'danger';
  return 'neutral';
}

interface AdminProjectsDetailCardProps {
  project: AdminCompanyProjectListItem;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}

export function AdminProjectsDetailCard({
  project,
  acting,
  onApprove,
  onReject,
  onDelete,
}: AdminProjectsDetailCardProps) {
  const { t, i18n } = useTranslation();
  const canModerate = project.status === CompanyProjectStatus.PENDING;
  const gallery = [
    project.imageUrl,
    ...project.demoImages.filter((url) => url !== project.imageUrl),
  ];

  return (
    <View className="gap-4 border-t border-slate-100 pt-3 dark:border-dm-border">
      <PressableFullscreenImage
        uri={project.imageUrl}
        gallery={gallery}
        galleryIndex={0}
        className="overflow-hidden rounded-xl"
        height={176}
      />

      <View className="flex-row flex-wrap items-center gap-2">
        <AdminStatusBadge
          label={t(`admin.projects.status.${project.status}`)}
          tone={projectTone(project.status)}
        />
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {new Date(project.createdAt).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View>
        <Text
          className="text-base font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold') }}
        >
          {project.title}
        </Text>
        <Text
          className="mt-1 text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {project.company.name}
        </Text>
        {project.company.categoryName ? (
          <Text
            className="mt-0.5 text-sm text-ink-muted dark:text-white/65"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {project.company.categoryName}
          </Text>
        ) : null}
      </View>

      {project.description ? (
        <Text
          className="text-sm text-ink-muted dark:text-white/75"
          style={{ fontFamily: getFontFamily('regular'), lineHeight: 22 }}
        >
          {project.description}
        </Text>
      ) : null}

      {project.customServices.length > 0 ? (
        <View>
          <Text
            className="mb-2 text-sm font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('admin.projects.services')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {project.customServices.map((service) => (
              <View
                key={service}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-dm-border dark:bg-dm-elevated"
              >
                <Text
                  className="text-xs text-ink dark:text-white"
                  style={{ fontFamily: getFontFamily('medium'), lineHeight: 16 }}
                >
                  {service}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {project.demoImages.length > 0 ? (
        <View>
          <Text
            className="mb-2 text-sm font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('admin.projects.gallery')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {project.demoImages.map((url, index) => {
              const galleryIndex = gallery.indexOf(url);
              return (
                <View key={`${url}-${index}`} className="w-[48%] overflow-hidden rounded-lg">
                  <PressableFullscreenImage
                    uri={url}
                    gallery={gallery}
                    galleryIndex={galleryIndex >= 0 ? galleryIndex : index + 1}
                    height={96}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <AdminActionButtons
        acting={acting}
        approveLabel={t('admin.actions.approve')}
        rejectLabel={t('admin.actions.reject')}
        deleteLabel={t('admin.actions.delete')}
        onApprove={canModerate ? onApprove : undefined}
        onReject={canModerate ? onReject : undefined}
        onDelete={onDelete}
      />
    </View>
  );
}
