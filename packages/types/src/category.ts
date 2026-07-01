export interface CategoryServicePublic {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CategorySubcategoryPublic {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  sortOrder: number;
}

export interface CategoryPublic {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  iconUrl?: string | null;
  companyCount?: number;
  services?: CategoryServicePublic[];
  subcategories?: CategorySubcategoryPublic[];
  createdAt: string;
}

export interface CreateCategoryInput {
  nameEn: string;
  nameAr: string;
  iconUrl?: string | null;
}

export interface UpdateCategoryInput {
  nameEn?: string;
  nameAr?: string;
  iconUrl?: string | null;
}

export interface CreateCategorySubcategoryInput {
  nameEn: string;
  nameAr: string;
}

export interface UpdateCategorySubcategoryInput {
  nameEn?: string;
  nameAr?: string;
}

export interface CreateCategoryServiceInput {
  name: string;
}

export type CategoriesListResponse = CategoryPublic[];
