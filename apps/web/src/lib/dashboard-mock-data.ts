export const dashboardStats = [
  { key: 'sales', value: '237', change: '+42%', positive: true },
  { key: 'orders', value: '27', change: '-12%', positive: false },
  { key: 'customers', value: '700', change: '+42%', positive: true },
  { key: 'products', value: '1237', change: '+42%', positive: true },
  { key: 'lowStock', value: '237', change: '-42%', positive: false },
] as const;

export const latestReviews = [
  {
    id: '1',
    company: 'شركة الاتصالات',
    user: 'محمد علي',
    location: 'قطر، الدوحة',
    rating: 5,
    status: 'pending' as const,
  },
  {
    id: '2',
    company: 'شركة الاتصالات',
    user: 'محمد علي',
    location: 'قطر، الدوحة',
    rating: 5,
    status: 'approved' as const,
  },
  {
    id: '3',
    company: 'شركة الاتصالات',
    user: 'محمد علي',
    location: 'قطر، الدوحة',
    rating: 5,
    status: 'rejected' as const,
  },
  {
    id: '4',
    company: 'شركة الاتصالات',
    user: 'محمد علي',
    location: 'قطر، الدوحة',
    rating: 5,
    status: 'useful' as const,
  },
];

export const topCompanies = [
  { name: 'شركة الاتصالات', count: '350', rating: 5 },
  { name: 'شركة الاتصالات', count: '350', rating: 5 },
  { name: 'شركة الاتصالات', count: '350', rating: 5 },
  { name: 'شركة الاتصالات', count: '350', rating: 5 },
  { name: 'شركة الاتصالات', count: '350', rating: 5 },
];

export const topReviewers = [
  { name: 'محمد علي', location: 'قطر، الدوحة', count: '350' },
  { name: 'محمد علي', location: 'قطر، الدوحة', count: '350' },
  { name: 'محمد علي', location: 'قطر، الدوحة', count: '350' },
  { name: 'محمد علي', location: 'قطر، الدوحة', count: '350' },
  { name: 'محمد علي', location: 'قطر، الدوحة', count: '350' },
];

export const chartBars = [40, 55, 45, 70, 60, 80, 65, 75, 50, 68];
