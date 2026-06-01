import type {
  CompanyPublic,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  ReviewPublic,
} from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';

interface MockCompany extends CompanyPublic {
  categoryId: CategoryId;
  keywords: string[];
}

const BASE_DATE = '2025-01-15T10:00:00.000Z';

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: 'mock-ooredoo',
    name: 'Ooredoo Qatar',
    slug: 'ooredoo-qatar',
    description:
      'Leading telecommunications provider in Qatar offering mobile, home internet, and business connectivity solutions with nationwide 5G coverage.',
    logo: 'https://picsum.photos/seed/ooredoo-qatar/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.2,
    reviewCount: 156,
    createdAt: BASE_DATE,
    categoryId: 'technology',
    keywords: ['telecom', 'technology', 'business', 'mobile', 'internet'],
  },
  {
    id: 'mock-qnb',
    name: 'QNB',
    slug: 'qnb',
    description:
      'Qatar National Bank offers retail and corporate banking, cards, loans, and digital services across Qatar.',
    logo: 'https://picsum.photos/seed/qnb-qatar/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.8,
    reviewCount: 520,
    createdAt: '2024-12-01T10:00:00.000Z',
    categoryId: 'finance',
    keywords: ['bank', 'finance', 'banking', 'business'],
  },
  {
    id: 'mock-qatar-airways',
    name: 'Qatar Airways',
    slug: 'qatar-airways',
    description:
      'Award-winning airline connecting Doha to the world with premium cabins, oneworld membership, and Hamad International hub operations.',
    logo: 'https://picsum.photos/seed/qatar-airways/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.6,
    reviewCount: 892,
    createdAt: '2024-11-02T08:00:00.000Z',
    categoryId: 'travel',
    keywords: ['travel', 'airline', 'aviation', 'business'],
  },
  {
    id: 'mock-al-meera',
    name: 'Al Meera',
    slug: 'al-meera',
    description:
      'Popular Qatari hypermarket chain known for fresh produce, local products, and convenient neighborhood locations across the country.',
    logo: null,
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.0,
    reviewCount: 234,
    createdAt: '2024-10-18T12:00:00.000Z',
    categoryId: 'retail',
    keywords: ['retail', 'supermarket', 'grocery', 'shopping'],
  },
  {
    id: 'mock-viva-fitness',
    name: 'Viva Fitness Doha',
    slug: 'viva-fitness-doha',
    description:
      'Modern gym in West Bay with strength zones, group classes, personal training, and extended hours for busy professionals.',
    logo: 'https://picsum.photos/seed/viva-fitness/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 3.8,
    reviewCount: 67,
    createdAt: '2024-09-05T09:00:00.000Z',
    categoryId: 'fitness',
    keywords: ['fitness', 'gym', 'health', 'wellness'],
  },
  {
    id: 'mock-parisa',
    name: 'Parisa Souq Waqif',
    slug: 'parisa-souq-waqif',
    description:
      'Iconic Persian restaurant in the heart of Souq Waqif serving traditional stews, kebabs, and tea in a lantern-lit courtyard setting.',
    logo: 'https://picsum.photos/seed/parisa-souq/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.5,
    reviewCount: 312,
    createdAt: '2024-08-22T18:00:00.000Z',
    categoryId: 'dining',
    keywords: ['dining', 'restaurant', 'food', 'persian'],
  },
  {
    id: 'mock-doha-clinic',
    name: 'Doha Clinic',
    slug: 'doha-clinic',
    description:
      'Multi-specialty medical center offering general practice, pediatrics, diagnostics, and same-day appointments in central Doha.',
    logo: null,
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.3,
    reviewCount: 128,
    createdAt: '2024-07-14T11:00:00.000Z',
    categoryId: 'health',
    keywords: ['health', 'medical', 'clinic', 'healthcare'],
  },
  {
    id: 'mock-carrefour',
    name: 'Carrefour Qatar',
    slug: 'carrefour-qatar',
    description:
      'Large-format hypermarket with electronics, groceries, and home goods at Mall of Qatar and other major retail destinations.',
    logo: 'https://picsum.photos/seed/carrefour-qatar/200/200',
    country: 'Qatar',
    city: 'Al Rayyan',
    ratingAverage: 3.9,
    reviewCount: 445,
    createdAt: '2024-06-30T14:00:00.000Z',
    categoryId: 'retail',
    keywords: ['retail', 'shopping', 'hypermarket', 'electronics'],
  },
  {
    id: 'mock-msheireb',
    name: 'Msheireb Properties',
    slug: 'msheireb-properties',
    description:
      'Developer behind Msheireb Downtown Doha, focused on sustainable urban living, retail spaces, and premium residential towers.',
    logo: 'https://picsum.photos/seed/msheireb/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.7,
    reviewCount: 89,
    createdAt: '2024-05-12T16:00:00.000Z',
    categoryId: 'realestate',
    keywords: ['real estate', 'realestate', 'property', 'luxury', 'business'],
  },
  {
    id: 'mock-vodafone',
    name: 'Vodafone Qatar',
    slug: 'vodafone-qatar',
    description:
      'Mobile and home broadband operator serving consumers and enterprises with prepaid, postpaid, and fiber packages.',
    logo: null,
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 3.5,
    reviewCount: 201,
    createdAt: '2024-04-08T10:30:00.000Z',
    categoryId: 'technology',
    keywords: ['telecom', 'technology', 'mobile', 'internet'],
  },
  {
    id: 'mock-texas-chicken',
    name: 'Texas Chicken Lusail',
    slug: 'texas-chicken-lusail',
    description:
      'Fast-food branch near Lusail Stadium serving crispy fried chicken, sliders, and family meal boxes for dine-in and delivery.',
    logo: 'https://picsum.photos/seed/texas-chicken/200/200',
    country: 'Qatar',
    city: 'Lusail',
    ratingAverage: 4.1,
    reviewCount: 178,
    createdAt: '2024-03-20T19:00:00.000Z',
    categoryId: 'dining',
    keywords: ['dining', 'restaurant', 'food', 'fast food'],
  },
  {
    id: 'mock-qatar-business',
    name: 'Qatar Business Solutions',
    slug: 'qatar-business-solutions',
    description:
      'Management consulting and corporate advisory services for SMEs and enterprises operating in Qatar.',
    logo: 'https://picsum.photos/seed/qatar-business/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.4,
    reviewCount: 92,
    createdAt: '2024-08-01T10:00:00.000Z',
    categoryId: 'business',
    keywords: ['business', 'consulting', 'corporate', 'management'],
  },
  {
    id: 'mock-west-bay-consulting',
    name: 'West Bay Consulting',
    slug: 'west-bay-consulting',
    description:
      'Strategy and operations consulting for hospitality, retail, and government-linked projects in Doha.',
    logo: null,
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.6,
    reviewCount: 64,
    createdAt: '2024-07-20T10:00:00.000Z',
    categoryId: 'business',
    keywords: ['business', 'consulting', 'strategy'],
  },
  {
    id: 'mock-doha-corporate',
    name: 'Doha Corporate Services',
    slug: 'doha-corporate-services',
    description:
      'Company formation, payroll, and compliance support for businesses setting up in Qatar.',
    logo: 'https://picsum.photos/seed/doha-corporate/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.2,
    reviewCount: 41,
    createdAt: '2024-06-15T10:00:00.000Z',
    categoryId: 'business',
    keywords: ['business', 'corporate', 'compliance'],
  },
  {
    id: 'mock-al-rayyan-motors',
    name: 'Al Rayyan Motors',
    slug: 'al-rayyan-motors',
    description:
      'Authorized dealer for premium SUVs and sedans with service center and test-drive bookings in Al Rayyan.',
    logo: 'https://picsum.photos/seed/al-rayyan-motors/200/200',
    country: 'Qatar',
    city: 'Al Rayyan',
    ratingAverage: 4.5,
    reviewCount: 187,
    createdAt: '2024-09-10T10:00:00.000Z',
    categoryId: 'automotive',
    keywords: ['automotive', 'car', 'dealer', 'suv'],
  },
  {
    id: 'mock-premium-auto',
    name: 'Premium Auto Qatar',
    slug: 'premium-auto-qatar',
    description:
      'Luxury vehicle imports, detailing, and extended warranty packages for Doha drivers.',
    logo: 'https://picsum.photos/seed/premium-auto-qatar/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.3,
    reviewCount: 112,
    createdAt: '2024-08-05T10:00:00.000Z',
    categoryId: 'automotive',
    keywords: ['automotive', 'luxury', 'cars', 'detailing'],
  },
  {
    id: 'mock-lusail-car-care',
    name: 'Lusail Car Care',
    slug: 'lusail-car-care',
    description:
      'Quick service garage offering oil changes, tire fitting, and AC repair near Lusail Boulevard.',
    logo: null,
    country: 'Qatar',
    city: 'Lusail',
    ratingAverage: 4.0,
    reviewCount: 76,
    createdAt: '2024-05-22T10:00:00.000Z',
    categoryId: 'automotive',
    keywords: ['automotive', 'garage', 'service', 'repair'],
  },
  {
    id: 'mock-pearl-luxury',
    name: 'Pearl Luxury Retail',
    slug: 'pearl-luxury-retail',
    description:
      'Curated luxury fashion and accessories boutique at The Pearl-Qatar with personal styling appointments.',
    logo: 'https://picsum.photos/seed/pearl-luxury/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.7,
    reviewCount: 98,
    createdAt: '2024-10-01T10:00:00.000Z',
    categoryId: 'luxury',
    keywords: ['luxury', 'fashion', 'boutique', 'lifestyle'],
  },
  {
    id: 'mock-vogue-boutique',
    name: 'Vogue Boutique Doha',
    slug: 'vogue-boutique-doha',
    description:
      'Designer handbags, watches, and evening wear for discerning shoppers in West Bay.',
    logo: 'https://picsum.photos/seed/vogue-boutique/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.5,
    reviewCount: 55,
    createdAt: '2024-07-08T10:00:00.000Z',
    categoryId: 'luxury',
    keywords: ['luxury', 'designer', 'fashion'],
  },
  {
    id: 'mock-collection-qatar',
    name: 'The Collection Qatar',
    slug: 'the-collection-qatar',
    description:
      'High-end home décor, art pieces, and bespoke furniture for premium residences.',
    logo: null,
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.8,
    reviewCount: 33,
    createdAt: '2024-04-18T10:00:00.000Z',
    categoryId: 'luxury',
    keywords: ['luxury', 'home', 'lifestyle', 'furniture'],
  },
  {
    id: 'mock-doha-learning',
    name: 'Doha Learning Center',
    slug: 'doha-learning-center',
    description:
      'After-school programs, STEM workshops, and exam prep for students across primary and secondary levels.',
    logo: 'https://picsum.photos/seed/doha-learning/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.6,
    reviewCount: 142,
    createdAt: '2024-09-12T10:00:00.000Z',
    categoryId: 'education',
    keywords: ['education', 'school', 'tutoring', 'stem'],
  },
  {
    id: 'mock-qatar-skills',
    name: 'Qatar Skills Academy',
    slug: 'qatar-skills-academy',
    description:
      'Professional certifications in IT, project management, and business skills with evening classes.',
    logo: 'https://picsum.photos/seed/qatar-skills/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.4,
    reviewCount: 88,
    createdAt: '2024-08-28T10:00:00.000Z',
    categoryId: 'education',
    keywords: ['education', 'training', 'certification', 'courses'],
  },
  {
    id: 'mock-bright-minds',
    name: 'Bright Minds Tutoring',
    slug: 'bright-minds-tutoring',
    description:
      'One-to-one tutoring in English, math, and sciences for international curriculum students.',
    logo: null,
    country: 'Qatar',
    city: 'Al Rayyan',
    ratingAverage: 4.5,
    reviewCount: 61,
    createdAt: '2024-06-02T10:00:00.000Z',
    categoryId: 'education',
    keywords: ['education', 'tutoring', 'students'],
  },
  {
    id: 'mock-doha-islamic-bank',
    name: 'Doha Islamic Bank',
    slug: 'doha-islamic-bank',
    description:
      'Sharia-compliant retail banking with savings accounts, financing, and digital banking in Qatar.',
    logo: 'https://picsum.photos/seed/doha-islamic-bank/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.3,
    reviewCount: 210,
    createdAt: '2024-05-01T10:00:00.000Z',
    categoryId: 'finance',
    keywords: ['finance', 'bank', 'islamic', 'banking'],
  },
  {
    id: 'mock-qatar-insurance',
    name: 'Qatar Insurance Co',
    slug: 'qatar-insurance-co',
    description:
      'Motor, health, and property insurance plans for individuals and businesses across Qatar.',
    logo: 'https://picsum.photos/seed/qatar-insurance/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.1,
    reviewCount: 134,
    createdAt: '2024-04-12T10:00:00.000Z',
    categoryId: 'finance',
    keywords: ['finance', 'insurance', 'business'],
  },
  {
    id: 'mock-regency-travel',
    name: 'Regency Travel Agency',
    slug: 'regency-travel-agency',
    description:
      'Holiday packages, visa assistance, and corporate travel management from Doha.',
    logo: 'https://picsum.photos/seed/regency-travel/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.4,
    reviewCount: 167,
    createdAt: '2024-08-15T10:00:00.000Z',
    categoryId: 'travel',
    keywords: ['travel', 'agency', 'tourism', 'flights'],
  },
  {
    id: 'mock-hamad-medical',
    name: 'Hamad Wellness Clinic',
    slug: 'hamad-wellness-clinic',
    description:
      'Family medicine, dermatology, and preventive health screenings in a modern clinic setting.',
    logo: 'https://picsum.photos/seed/hamad-wellness/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.6,
    reviewCount: 203,
    createdAt: '2024-09-20T10:00:00.000Z',
    categoryId: 'health',
    keywords: ['health', 'clinic', 'medical', 'wellness'],
  },
  {
    id: 'mock-fitness-first',
    name: 'Fitness First Doha',
    slug: 'fitness-first-doha',
    description:
      'Large fitness club with pool, classes, and personal trainers in central Doha.',
    logo: 'https://picsum.photos/seed/fitness-first/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.2,
    reviewCount: 245,
    createdAt: '2024-07-01T10:00:00.000Z',
    categoryId: 'fitness',
    keywords: ['fitness', 'gym', 'pool', 'classes'],
  },
  {
    id: 'mock-sultans-tent',
    name: "Sultan's Tent Restaurant",
    slug: 'sultans-tent-restaurant',
    description:
      'Arabic and Lebanese cuisine with outdoor seating and live music on weekends.',
    logo: 'https://picsum.photos/seed/sultans-tent/200/200',
    country: 'Qatar',
    city: 'Doha',
    ratingAverage: 4.3,
    reviewCount: 198,
    createdAt: '2024-06-18T10:00:00.000Z',
    categoryId: 'dining',
    keywords: ['dining', 'restaurant', 'arabic', 'lebanese'],
  },
  {
    id: 'mock-ezdan-realty',
    name: 'Ezdan Real Estate',
    slug: 'ezdan-real-estate',
    description:
      'Residential and commercial property listings with leasing support across Lusail and Al Wakra.',
    logo: 'https://picsum.photos/seed/ezdan-realty/200/200',
    country: 'Qatar',
    city: 'Lusail',
    ratingAverage: 4.2,
    reviewCount: 118,
    createdAt: '2024-05-30T10:00:00.000Z',
    categoryId: 'realestate',
    keywords: ['realestate', 'property', 'leasing', 'real estate'],
  },
];

export const MOCK_COMPANY_SLUGS = MOCK_COMPANIES.map((company) => company.slug);

const MOCK_REVIEWS: Record<string, ReviewPublic[]> = {
  'mock-ooredoo': [
    {
      id: 'rev-ooredoo-1',
      companyId: 'mock-ooredoo',
      userId: 'user-sara',
      rating: 5,
      title: 'Excellent 5G coverage across Doha',
      content:
        'Switched to Ooredoo fiber and mobile last year. Speeds are consistently fast and customer support resolved my billing issue within one call.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-19T10:00:00.000Z',
      updatedAt: '2025-05-19T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
      reply: {
        id: 'reply-ooredoo-1',
        content: 'Thank you Sara! We are glad our team could help quickly.',
        createdAt: '2025-05-20T09:00:00.000Z',
      },
    },
    {
      id: 'rev-ooredoo-2',
      companyId: 'mock-ooredoo',
      userId: 'user-mohammed',
      rating: 4,
      title: 'Reliable service, app could be better',
      content:
        'Network is stable for work calls and streaming. The self-service app feels a bit cluttered compared to competitors.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-03T10:00:00.000Z',
      updatedAt: '2025-05-03T10:00:00.000Z',
      author: { id: 'user-mohammed', email: 'mohammed.ali@example.com' },
    },
    {
      id: 'rev-ooredoo-3',
      companyId: 'mock-ooredoo',
      userId: 'user-fatima',
      rating: 5,
      title: 'Smooth store experience in City Center',
      content: 'Staff helped me pick the right plan and transferred my number same day. Very professional.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-16T10:00:00.000Z',
      updatedAt: '2025-04-16T10:00:00.000Z',
      author: { id: 'user-fatima', email: 'fatima.hassan@example.com' },
    },
    {
      id: 'rev-ooredoo-4',
      companyId: 'mock-ooredoo',
      userId: 'user-ahmed',
      rating: 3,
      title: 'Good network, slow installation wait',
      content: 'Internet quality is great once installed, but I waited two weeks for a technician slot.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-01T10:00:00.000Z',
      updatedAt: '2025-04-01T10:00:00.000Z',
      author: { id: 'user-ahmed', email: 'ahmed.khalid@example.com' },
    },
  ],
  'mock-qatar-airways': [
    {
      id: 'rev-qa-1',
      companyId: 'mock-qatar-airways',
      userId: 'user-mohammed',
      rating: 5,
      title: 'Best long-haul experience I have had',
      content:
        'Business class seat, service, and lounge at DOH were all outstanding. Would choose them again for Europe trips.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-23T10:00:00.000Z',
      updatedAt: '2025-05-23T10:00:00.000Z',
      author: { id: 'user-mohammed', email: 'mohammed.ali@example.com' },
      reply: {
        id: 'reply-qa-1',
        content: 'We appreciate your feedback and look forward to welcoming you onboard again.',
        createdAt: '2025-05-24T09:00:00.000Z',
      },
    },
    {
      id: 'rev-qa-2',
      companyId: 'mock-qatar-airways',
      userId: 'user-sara',
      rating: 5,
      title: 'On-time and comfortable economy',
      content: 'Even in economy the legroom and meal quality were above average for the route.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-11T10:00:00.000Z',
      updatedAt: '2025-05-11T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
    {
      id: 'rev-qa-3',
      companyId: 'mock-qatar-airways',
      userId: 'user-layla',
      rating: 5,
      title: 'Exceptional cabin crew',
      content: 'Crew remembered dietary preferences and checked in throughout a 9-hour flight.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-11T10:00:00.000Z',
      updatedAt: '2025-04-11T10:00:00.000Z',
      author: { id: 'user-layla', email: 'layla.omar@example.com' },
    },
    {
      id: 'rev-qa-4',
      companyId: 'mock-qatar-airways',
      userId: 'user-ahmed',
      rating: 4,
      title: 'Al Mourjan lounge is worth it',
      content: 'Spacious lounge with good food options before an early morning departure.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-03-20T10:00:00.000Z',
      updatedAt: '2025-03-20T10:00:00.000Z',
      author: { id: 'user-ahmed', email: 'ahmed.khalid@example.com' },
    },
    {
      id: 'rev-qa-5',
      companyId: 'mock-qatar-airways',
      userId: 'user-youssef',
      rating: 4,
      title: 'Reliable for frequent travel',
      content: 'Fly this route monthly for work. Consistent schedule and professional ground staff.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-02-10T10:00:00.000Z',
      updatedAt: '2025-02-10T10:00:00.000Z',
      author: { id: 'user-youssef', email: 'youssef.nasser@example.com' },
    },
  ],
  'mock-al-meera': [
    {
      id: 'rev-almeera-1',
      companyId: 'mock-al-meera',
      userId: 'user-fatima',
      rating: 4,
      title: 'Always find what I need nearby',
      content: 'Clean aisles, good variety of local and imported goods, and shorter queues than megastores.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-16T10:00:00.000Z',
      updatedAt: '2025-05-16T10:00:00.000Z',
      author: { id: 'user-fatima', email: 'fatima.hassan@example.com' },
      reply: {
        id: 'reply-almeera-1',
        content: 'Thanks for shopping with Al Meera! We work hard to keep shelves stocked daily.',
        createdAt: '2025-05-17T09:00:00.000Z',
      },
    },
    {
      id: 'rev-almeera-2',
      companyId: 'mock-al-meera',
      userId: 'user-sara',
      rating: 4,
      title: 'Fresh bakery every morning',
      content: 'Bread and pastries section is consistently fresh. Great for weekend breakfast runs.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-29T10:00:00.000Z',
      updatedAt: '2025-04-29T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
  ],
  'mock-viva-fitness': [
    {
      id: 'rev-viva-1',
      companyId: 'mock-viva-fitness',
      userId: 'user-youssef',
      rating: 4,
      title: 'Well-equipped weight room',
      content: 'Plenty of racks and free weights before 7am. Gets crowded after office hours.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-13T10:00:00.000Z',
      updatedAt: '2025-05-13T10:00:00.000Z',
      author: { id: 'user-youssef', email: 'youssef.nasser@example.com' },
    },
    {
      id: 'rev-viva-2',
      companyId: 'mock-viva-fitness',
      userId: 'user-mohammed',
      rating: 3,
      title: 'Membership pricing is steep',
      content: 'Facilities are good but monthly fees feel high compared to other gyms in the area.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-06T10:00:00.000Z',
      updatedAt: '2025-04-06T10:00:00.000Z',
      author: { id: 'user-mohammed', email: 'mohammed.ali@example.com' },
    },
  ],
  'mock-parisa': [
    {
      id: 'rev-parisa-1',
      companyId: 'mock-parisa',
      userId: 'user-layla',
      rating: 5,
      title: 'Unforgettable atmosphere',
      content: 'Dining under the stars in the souq courtyard felt special. Fesenjan was rich and flavorful.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-25T10:00:00.000Z',
      updatedAt: '2025-05-25T10:00:00.000Z',
      author: { id: 'user-layla', email: 'layla.omar@example.com' },
    },
    {
      id: 'rev-parisa-2',
      companyId: 'mock-parisa',
      userId: 'user-ahmed',
      rating: 5,
      title: 'Perfect for visitors',
      content: 'Took guests from abroad here and they loved the ambience and live music nearby.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-09T10:00:00.000Z',
      updatedAt: '2025-05-09T10:00:00.000Z',
      author: { id: 'user-ahmed', email: 'ahmed.khalid@example.com' },
    },
    {
      id: 'rev-parisa-3',
      companyId: 'mock-parisa',
      userId: 'user-sara',
      rating: 4,
      title: 'Book ahead on weekends',
      content: 'Food and service were excellent but we waited 25 minutes without a reservation.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-23T10:00:00.000Z',
      updatedAt: '2025-04-23T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
  ],
  'mock-doha-clinic': [
    {
      id: 'rev-clinic-1',
      companyId: 'mock-doha-clinic',
      userId: 'user-fatima',
      rating: 5,
      title: 'Thorough pediatric visit',
      content: 'Doctor spent time explaining treatment options and follow-up clearly for our child.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-20T10:00:00.000Z',
      updatedAt: '2025-05-20T10:00:00.000Z',
      author: { id: 'user-fatima', email: 'fatima.hassan@example.com' },
    },
    {
      id: 'rev-clinic-2',
      companyId: 'mock-doha-clinic',
      userId: 'user-sara',
      rating: 4,
      title: 'Efficient lab turnaround',
      content: 'Blood work results were available online the next morning. Reception was organized.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-02T10:00:00.000Z',
      updatedAt: '2025-05-02T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
  ],
  'mock-carrefour': [
    {
      id: 'rev-carrefour-1',
      companyId: 'mock-carrefour',
      userId: 'user-mohammed',
      rating: 4,
      title: 'Huge selection under one roof',
      content: 'Great when you need groceries and household items in a single trip.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-17T10:00:00.000Z',
      updatedAt: '2025-05-17T10:00:00.000Z',
      author: { id: 'user-mohammed', email: 'mohammed.ali@example.com' },
    },
  ],
  'mock-msheireb': [
    {
      id: 'rev-msheireb-1',
      companyId: 'mock-msheireb',
      userId: 'user-youssef',
      rating: 5,
      title: 'Beautiful walkable neighborhood',
      content: 'Love the shaded streets, public art, and mix of cafes around the district.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-22T10:00:00.000Z',
      updatedAt: '2025-05-22T10:00:00.000Z',
      author: { id: 'user-youssef', email: 'youssef.nasser@example.com' },
    },
    {
      id: 'rev-msheireb-2',
      companyId: 'mock-msheireb',
      userId: 'user-sara',
      rating: 5,
      title: 'High-quality apartment finish',
      content: 'Move-in was smooth and building management responds quickly to maintenance requests.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-20T10:00:00.000Z',
      updatedAt: '2025-04-20T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
  ],
  'mock-vodafone': [
    {
      id: 'rev-vodafone-1',
      companyId: 'mock-vodafone',
      userId: 'user-ahmed',
      rating: 4,
      title: 'Competitive prepaid deals',
      content: 'Tourist SIM was easy to activate at the airport kiosk with clear data bundles.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-15T10:00:00.000Z',
      updatedAt: '2025-05-15T10:00:00.000Z',
      author: { id: 'user-ahmed', email: 'ahmed.khalid@example.com' },
    },
    {
      id: 'rev-vodafone-2',
      companyId: 'mock-vodafone',
      userId: 'user-layla',
      rating: 3,
      title: 'Support chat took too long',
      content: 'Issue was resolved eventually but I waited over 30 minutes for a live agent.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-04-03T10:00:00.000Z',
      updatedAt: '2025-04-03T10:00:00.000Z',
      author: { id: 'user-layla', email: 'layla.omar@example.com' },
    },
  ],
  'mock-texas-chicken': [
    {
      id: 'rev-texas-1',
      companyId: 'mock-texas-chicken',
      userId: 'user-sara',
      rating: 5,
      title: 'Crispy and hot every time',
      content: 'Delivery orders still arrive crunchy. Honey butter biscuits are dangerously good.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-26T10:00:00.000Z',
      updatedAt: '2025-05-26T10:00:00.000Z',
      author: { id: 'user-sara', email: 'sara.ahmed@example.com' },
    },
    {
      id: 'rev-texas-2',
      companyId: 'mock-texas-chicken',
      userId: 'user-youssef',
      rating: 4,
      title: 'Quick service after matches',
      content: 'Line moved fast even when the stadium crowd poured in. Staff stayed upbeat.',
      status: ReviewStatus.APPROVED,
      createdAt: '2025-05-07T10:00:00.000Z',
      updatedAt: '2025-05-07T10:00:00.000Z',
      author: { id: 'user-youssef', email: 'youssef.nasser@example.com' },
    },
  ],
};

function toPublicCompany(company: MockCompany): CompanyPublic {
  const { keywords: _keywords, ...publicCompany } = company;
  return publicCompany;
}

function matchesQuery(company: MockCompany, query: string): boolean {
  const haystack = [
    company.name,
    company.description ?? '',
    company.city,
    company.country,
    ...company.keywords,
  ]
    .join(' ')
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function sortCompanies(companies: MockCompany[], sort: string): MockCompany[] {
  const sorted = [...companies];

  switch (sort) {
    case 'reviews':
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
    default:
      sorted.sort((a, b) => b.ratingAverage - a.ratingAverage || b.reviewCount - a.reviewCount);
      break;
  }

  return sorted;
}

function buildPaginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function parseCategoryId(value: string | null): CategoryId | undefined {
  if (!value) return undefined;
  return CATEGORY_IDS.includes(value as CategoryId) ? (value as CategoryId) : undefined;
}

/** List mock companies for a category (used by category detail pages). */
export function getMockCompaniesByCategory(
  categoryId: CategoryId,
  options?: {
    query?: string;
    minRating?: number;
    sort?: string;
    page?: number;
    limit?: number;
  },
): PaginatedCompaniesResponse {
  const params = new URLSearchParams();
  params.set('category', categoryId);
  if (options?.query) params.set('query', options.query);
  if (options?.minRating !== undefined) params.set('minRating', String(options.minRating));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  return searchMockCompanies(params);
}

export function searchMockCompanies(params: URLSearchParams): PaginatedCompaniesResponse {
  const query = params.get('query')?.trim() ?? '';
  const categoryId = parseCategoryId(params.get('category'));
  const country = params.get('country')?.trim().toLowerCase();
  const city = params.get('city')?.trim().toLowerCase();
  const minRating = params.get('minRating') ? Number(params.get('minRating')) : undefined;
  const sort = params.get('sort') ?? 'rating';
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const limit = Math.max(1, Number(params.get('limit') ?? 12));

  let filtered = MOCK_COMPANIES.filter((company) => {
    if (categoryId && company.categoryId !== categoryId) return false;
    if (query && !matchesQuery(company, query)) return false;
    if (country && !company.country.toLowerCase().includes(country)) return false;
    if (city && !company.city.toLowerCase().includes(city)) return false;
    if (minRating !== undefined && company.ratingAverage < minRating) return false;
    return true;
  });

  filtered = sortCompanies(filtered, sort);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit).map(toPublicCompany);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export function getMockCompanyBySlug(slug: string): CompanyPublic | undefined {
  const company = MOCK_COMPANIES.find((item) => item.slug === slug);
  return company ? toPublicCompany(company) : undefined;
}

export function getMockReviewsByCompany(companyId: string): PaginatedReviewsResponse {
  const data = MOCK_REVIEWS[companyId] ?? [];

  return {
    data,
    meta: buildPaginationMeta(1, data.length || 1, data.length),
  };
}
