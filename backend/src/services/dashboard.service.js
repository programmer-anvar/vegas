import { ORDER_STATUSES } from '#models/Order.model.js';
import orderRepository from '#repositories/order.repository.js';
import userRepository from '#repositories/user.repository.js';

const MONTHS_BACK = 12;
const RECENT_ORDERS_LIMIT = 5;
const TASHKENT_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

const currentTashkentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { year: get('year'), month: get('month') };
};

const buildMonthKeys = (count) => {
  const { year, month } = currentTashkentMonth();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

const startOfMonthTashkent = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1) - TASHKENT_UTC_OFFSET_MS);
};

const dashboardService = {
  async getDashboard() {
    const monthKeys = buildMonthKeys(MONTHS_BACK);

    const [statusRows, revenueTotal, monthRows, customers, recent] = await Promise.all([
      orderRepository.countByStatus(),
      orderRepository.paidRevenueTotal(),
      orderRepository.paidRevenueByMonth(startOfMonthTashkent(monthKeys[0])),
      userRepository.count({ role: 'customer' }),
      orderRepository.findAll({ page: 1, limit: RECENT_ORDERS_LIMIT }),
    ]);

    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
    for (const row of statusRows) {
      ordersByStatus[row._id] = row.count;
    }

    const rowsByMonth = new Map(monthRows.map((row) => [row._id, row]));
    const revenueByMonth = monthKeys.map((month) => ({
      month,
      revenue: rowsByMonth.get(month)?.revenue ?? 0,
      orders: rowsByMonth.get(month)?.orders ?? 0,
    }));

    return {
      totals: {
        orders: Object.values(ordersByStatus).reduce((sum, n) => sum + n, 0),
        revenue: revenueTotal,
        customers,
      },
      ordersByStatus,
      revenueByMonth,
      recentOrders: recent.items,
    };
  },
};

export default dashboardService;
