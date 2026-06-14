const VISITOR_ID_KEY = 'rateq_visitor_id';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      return existing;
    }

    const visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    return crypto.randomUUID();
  }
}
