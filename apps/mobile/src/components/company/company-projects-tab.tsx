import { getFontFamily } from '@/i18n';
import type { CompanyProjectPublic } from '@rateq/types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

interface CompanyProjectsTabProps {
  companySlug: string;
  projects: CompanyProjectPublic[];
}

function ProjectCard({
  project,
  companySlug,
}: {
  project: CompanyProjectPublic;
  companySlug: string;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/company/${companySlug}/project/${project.slug}`)}
      className="mb-4 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-dm-elevated"
      style={{ marginHorizontal: '1%' }}
    >
      <Image source={{ uri: project.imageUrl }} className="h-36 w-full" resizeMode="cover" />
      <View className="min-h-[72px] justify-center bg-brand-500 px-3 py-3">
        <Text
          className="text-sm font-semibold text-white"
          style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
          numberOfLines={3}
        >
          {project.title}
        </Text>
      </View>
    </Pressable>
  );
}

export function CompanyProjectsTab({ companySlug, projects }: CompanyProjectsTabProps) {
  const { t } = useTranslation();
  const visibleProjects = projects.filter((project) => project.title.trim() && project.imageUrl);

  if (visibleProjects.length === 0) {
    return (
      <Text
        className="py-12 text-center text-sm text-ink-muted dark:text-white/70"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('company.noProjects')}
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap">
      {visibleProjects.map((project) => (
        <ProjectCard key={project.id} project={project} companySlug={companySlug} />
      ))}
    </View>
  );
}
