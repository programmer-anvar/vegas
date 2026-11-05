const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => ({
  page: toPositiveInt(query.page, 1),
  limit: Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit),
});
