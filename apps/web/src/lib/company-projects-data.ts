export interface CompanyProject {
  id: string;
  title: string;
  imageUrl: string;
}

const PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=480&h=320&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=480&h=320&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=480&h=320&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=480&h=320&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=480&h=320&q=80',
  'https://images.unsplash.com/photo-1477959858617-67f85ebb4e59?auto=format&fit=crop&w=480&h=320&q=80',
];

const PROJECT_TITLES = [
  'BCG & McKinsey Merger Management',
  'West Bay Commercial Tower Development',
  'Lusail Infrastructure Advisory',
  'Qatar Retail Expansion Strategy',
  'Healthcare Network Integration',
  'Smart City Digital Transformation',
];

/** Demo projects until company projects are stored in the API. */
export function getCompanyProjects(_companyId: string): CompanyProject[] {
  return PROJECT_TITLES.map((title, index) => ({
    id: `project-${index + 1}`,
    title,
    imageUrl: PROJECT_IMAGES[index % PROJECT_IMAGES.length] ?? PROJECT_IMAGES[0]!,
  }));
}
