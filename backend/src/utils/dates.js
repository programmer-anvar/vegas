const TASHKENT_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const monthRangeTashkent = (value) => {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(String(value ?? ''));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  return {
    from: new Date(Date.UTC(year, month - 1, 1) - TASHKENT_UTC_OFFSET_MS),
    to: new Date(Date.UTC(year, month, 1) - TASHKENT_UTC_OFFSET_MS),
  };
};

export const dayRangeTashkent = (value) => {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(String(value ?? ''));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const start = Date.UTC(year, month - 1, day);
  const check = new Date(start);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;

  return {
    from: new Date(start - TASHKENT_UTC_OFFSET_MS),
    to: new Date(start + DAY_MS - TASHKENT_UTC_OFFSET_MS),
  };
};

export const todayTashkent = () =>
  new Date(Date.now() + TASHKENT_UTC_OFFSET_MS).toISOString().slice(0, 10);

export const currentMonthTashkent = () => todayTashkent().slice(0, 7);

export const lastMonthKeys = (count) => {
  const [year, month] = currentMonthTashkent().split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};
