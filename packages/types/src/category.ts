export interface CategoryServicePublic {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CategoryPublic {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  companyCount?: number;
  services?: CategoryServicePublic[];
  createdAt: string;
}

export interface CreateCategoryInput {
  nameEn: string;
  nameAr: string;
}

export interface CreateCategoryServiceInput {
  name: string;
}

export type CategoriesListResponse = CategoryPublic[];
