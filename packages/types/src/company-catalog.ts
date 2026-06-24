export type CompanyCatalogType = 'service' | 'activity';

export interface CompanyCatalogItemPublic {
  id: string;
  type: CompanyCatalogType;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCompanyCatalogItemInput {
  type: CompanyCatalogType;
  nameEn: string;
  nameAr: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCompanyCatalogItemInput {
  nameEn?: string;
  nameAr?: string;
  sortOrder?: number;
  isActive?: boolean;
}
