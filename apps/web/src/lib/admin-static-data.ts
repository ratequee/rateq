export type AdminProjectStatus = 'featured' | 'published' | 'pending';

export interface AdminProjectRow {
  id: string;
  status: AdminProjectStatus;
  submittedAt: string;
  imageUrl: string;
}

export type AdminPaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface AdminPaymentRow {
  id: string;
  reference: string;
  amountQar: number;
  status: AdminPaymentStatus;
  paidAt: string;
}

export const ADMIN_PROJECT_STATS = {
  totalProjects: 48,
  featuredProjects: 12,
  pendingReview: 5,
  companiesWithProjects: 19,
} as const;

export const ADMIN_PROJECT_ROWS: AdminProjectRow[] = [
  {
    id: 'proj-1',
    status: 'featured',
    submittedAt: '2026-06-10',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-1/120/80',
  },
  {
    id: 'proj-2',
    status: 'published',
    submittedAt: '2026-06-08',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-2/120/80',
  },
  {
    id: 'proj-3',
    status: 'pending',
    submittedAt: '2026-06-12',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-3/120/80',
  },
  {
    id: 'proj-4',
    status: 'published',
    submittedAt: '2026-06-05',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-4/120/80',
  },
  {
    id: 'proj-5',
    status: 'featured',
    submittedAt: '2026-06-01',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-5/120/80',
  },
  {
    id: 'proj-6',
    status: 'pending',
    submittedAt: '2026-06-13',
    imageUrl: 'https://picsum.photos/seed/rateq-proj-6/120/80',
  },
];

export const ADMIN_PAYMENT_STATS = {
  totalRevenueQar: 128450,
  pendingPayoutsQar: 12400,
  completedThisMonth: 37,
  activeSubscriptions: 24,
} as const;

export const ADMIN_PAYMENT_ROWS: AdminPaymentRow[] = [
  {
    id: 'pay-1',
    reference: 'RQ-2026-00481',
    amountQar: 4800,
    status: 'completed',
    paidAt: '2026-06-12T09:14:00.000Z',
  },
  {
    id: 'pay-2',
    reference: 'RQ-2026-00472',
    amountQar: 450,
    status: 'completed',
    paidAt: '2026-06-11T14:22:00.000Z',
  },
  {
    id: 'pay-3',
    reference: 'RQ-2026-00469',
    amountQar: 1200,
    status: 'pending',
    paidAt: '2026-06-11T11:05:00.000Z',
  },
  {
    id: 'pay-4',
    reference: 'RQ-2026-00455',
    amountQar: 4800,
    status: 'completed',
    paidAt: '2026-06-09T16:40:00.000Z',
  },
  {
    id: 'pay-5',
    reference: 'RQ-2026-00441',
    amountQar: 750,
    status: 'failed',
    paidAt: '2026-06-08T08:18:00.000Z',
  },
  {
    id: 'pay-6',
    reference: 'RQ-2026-00438',
    amountQar: 450,
    status: 'refunded',
    paidAt: '2026-06-07T19:02:00.000Z',
  },
];
