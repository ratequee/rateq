import type { Company } from '@prisma/client';
import type { AdminProfileChangeField, UpdateCompanyInput } from '@rateq/types';
import { parseCompanyIdList } from './company.mapper';

type LabelResolver = (ids: string[]) => Promise<Map<string, string>>;

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    if (typeof value[0] === 'string') return value.join(', ');
    if (typeof value[0] === 'object' && value[0] && 'title' in value[0]) {
      return (value as Array<{ title: string }>).map((item) => item.title).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function currentFieldValue(company: Company, key: keyof UpdateCompanyInput): unknown {
  switch (key) {
    case 'name':
      return company.name;
    case 'nameAr':
      return company.nameAr;
    case 'description':
      return company.description;
    case 'descriptionEn':
      return company.descriptionEn ?? company.description;
    case 'descriptionAr':
      return company.descriptionAr;
    case 'websiteUrl':
      return company.websiteUrl;
    case 'phone':
      return company.phone;
    case 'address':
      return company.address;
    case 'country':
      return company.country;
    case 'city':
      return company.city;
    case 'categoryId':
      return company.categoryId;
    case 'crNumber':
      return company.crNumber;
    case 'validationDate':
      return company.validationDate?.toISOString().slice(0, 10) ?? null;
    case 'yearsEstablished':
      return company.yearsEstablished;
    case 'publicProjectCount':
      return company.publicProjectCount;
    case 'privateProjectCount':
      return company.privateProjectCount;
    case 'latitude':
      return company.latitude;
    case 'longitude':
      return company.longitude;
    case 'serviceIds':
      return parseCompanyIdList(company.serviceIds);
    case 'activityIds':
      return parseCompanyIdList(company.activityIds);
    case 'services':
      return Array.isArray(company.services) ? company.services : [];
    default:
      return undefined;
  }
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Company name',
  nameAr: 'Arabic name',
  description: 'Description',
  descriptionEn: 'Description (English)',
  descriptionAr: 'Description (Arabic)',
  websiteUrl: 'Website',
  phone: 'Phone',
  address: 'Address',
  country: 'Country',
  city: 'City',
  categoryId: 'Category',
  crNumber: 'CR number',
  validationDate: 'Validation date',
  yearsEstablished: 'Years established',
  publicProjectCount: 'Public projects count',
  privateProjectCount: 'Private projects count',
  latitude: 'Latitude',
  longitude: 'Longitude',
  serviceIds: 'Services',
  activityIds: 'Activities',
  services: 'Legacy services',
  projects: 'Projects',
};

export async function buildProfileChangeFields(
  company: Company,
  pending: UpdateCompanyInput,
  resolveLabels: LabelResolver,
): Promise<AdminProfileChangeField[]> {
  const fields: AdminProfileChangeField[] = [];

  for (const [rawKey, proposed] of Object.entries(pending)) {
    const key = rawKey as keyof UpdateCompanyInput;
    if (proposed === undefined) continue;

    const current = currentFieldValue(company, key);
    let currentDisplay = formatValue(current);
    let proposedDisplay = formatValue(proposed);

    if (key === 'serviceIds' || key === 'activityIds') {
      const currentIds = Array.isArray(current) ? (current as string[]) : [];
      const proposedIds = Array.isArray(proposed) ? proposed : [];
      const allIds = [...new Set([...currentIds, ...proposedIds])];
      const labelMap = await resolveLabels(allIds);
      currentDisplay =
        currentIds.length === 0 ? '—' : currentIds.map((id) => labelMap.get(id) ?? id).join(', ');
      proposedDisplay =
        proposedIds.length === 0 ? '—' : proposedIds.map((id) => labelMap.get(id) ?? id).join(', ');
    }

    if (currentDisplay === proposedDisplay) continue;

    fields.push({
      field: key,
      label: FIELD_LABELS[key] ?? key,
      current: currentDisplay,
      proposed: proposedDisplay,
    });
  }

  return fields;
}
