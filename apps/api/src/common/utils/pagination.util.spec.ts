import { buildPaginationMeta, paginationSkip } from './pagination.util';

describe('pagination.util', () => {
  describe('buildPaginationMeta', () => {
    it('computes pages and navigation flags', () => {
      const meta = buildPaginationMeta(2, 10, 25);

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('defaults to one page when total is zero', () => {
      const meta = buildPaginationMeta(1, 20, 0);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
    });
  });

  describe('paginationSkip', () => {
    it('calculates offset from page and limit', () => {
      expect(paginationSkip(3, 20)).toBe(40);
      expect(paginationSkip(1, 20)).toBe(0);
    });
  });
});
