export interface CategoryPublic {
  id: string;
  name: string;
  slug: string;
  companyCount?: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
}

export type CategoriesListResponse = CategoryPublic[];
