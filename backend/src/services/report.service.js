import { EXPENSE_CATEGORIES } from '#models/Expense.model.js';
import { SALE_PAYMENT_METHODS } from '#models/Sale.model.js';
import expenseRepository from '#repositories/expense.repository.js';
import saleRepository from '#repositories/sale.repository.js';
import stockCountRepository from '#repositories/stockCount.repository.js';
import ApiError from '#utils/ApiError.js';
import {
  currentMonthTashkent,
  dayRangeTashkent,
  lastMonthKeys,
  monthRangeTashkent,
  todayTashkent,
} from '#utils/dates.js';

const DEFAULT_MONTHS = 12;
const MAX_MONTHS = 36;

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const summarizeSales = (rows) => {
  const byPayment = Object.fromEntries(
    SALE_PAYMENT_METHODS.map((method) => [method, { count: 0, revenue: 0 }])
  );
  const totals = { count: 0, revenue: 0, cost: 0, discount: 0, costMissingCount: 0 };

  for (const row of rows) {
    if (byPayment[row._id]) {
      byPayment[row._id] = { count: row.count, revenue: row.revenue };
    }
    totals.count += row.count;
    totals.revenue += row.revenue;
    totals.cost += row.cost;
    totals.discount += row.discount;
    totals.costMissingCount += row.costMissing;
  }

  return { ...totals, grossProfit: totals.revenue - totals.cost, byPayment };
};

const summarizeExpenses = (rows) => {
  const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, 0]));
  let total = 0;

  for (const row of rows) {
    byCategory[row._id] = row.total;
    total += row.total;
  }

  return { total, byCategory };
};

const summarizeInventory = (row) => ({
  shrinkage: row?.shrinkage ?? 0,
  surplus: row?.surplus ?? 0,
});

const loadPeriod = async (range) => {
  const [saleRows, expenseRows, inventoryRow] = await Promise.all([
    saleRepository.aggregateByPayment(range.from, range.to),
    expenseRepository.aggregateByCategory(range.from, range.to),
    stockCountRepository.sumByPeriod(range.from, range.to),
  ]);
  const sales = summarizeSales(saleRows);
  const expenses = summarizeExpenses(expenseRows);
  const inventory = summarizeInventory(inventoryRow);

  return {
    sales,
    expenses,
    inventory,
    netProfit: sales.grossProfit - expenses.total - inventory.shrinkage + inventory.surplus,
  };
};

const reportService = {
  async monthly(month) {
    const key = month || currentMonthTashkent();
    const range = monthRangeTashkent(key);
    if (!range) {
      throw ApiError.badRequest("Oy formati noto'g'ri, masalan: 2026-11");
    }
    return { month: key, ...(await loadPeriod(range)) };
  },

  async daily(date) {
    const key = date || todayTashkent();
    const range = dayRangeTashkent(key);
    if (!range) {
      throw ApiError.badRequest("Sana formati noto'g'ri, masalan: 2026-11-04");
    }
    return { date: key, ...(await loadPeriod(range)) };
  },

  async months(count) {
    const keys = lastMonthKeys(Math.min(toPositiveInt(count, DEFAULT_MONTHS), MAX_MONTHS));
    const from = monthRangeTashkent(keys[0]).from;
    const to = monthRangeTashkent(keys[keys.length - 1]).to;

    const [saleRows, expenseRows, inventoryRows] = await Promise.all([
      saleRepository.aggregateByMonth(from, to),
      expenseRepository.aggregateByMonth(from, to),
      stockCountRepository.aggregateByMonth(from, to),
    ]);
    const salesByMonth = new Map(saleRows.map((row) => [row._id, row]));
    const expensesByMonth = new Map(expenseRows.map((row) => [row._id, row]));
    const inventoryByMonth = new Map(inventoryRows.map((row) => [row._id, row]));

    const months = keys.map((month) => {
      const sale = salesByMonth.get(month);
      const revenue = sale?.revenue ?? 0;
      const cost = sale?.cost ?? 0;
      const expenses = expensesByMonth.get(month)?.total ?? 0;
      const shrinkage = inventoryByMonth.get(month)?.shrinkage ?? 0;
      const surplus = inventoryByMonth.get(month)?.surplus ?? 0;
      return {
        month,
        salesCount: sale?.count ?? 0,
        revenue,
        cost,
        grossProfit: revenue - cost,
        expenses,
        shrinkage,
        surplus,
        netProfit: revenue - cost - expenses - shrinkage + surplus,
      };
    });

    const totals = months.reduce(
      (acc, m) => ({
        salesCount: acc.salesCount + m.salesCount,
        revenue: acc.revenue + m.revenue,
        cost: acc.cost + m.cost,
        grossProfit: acc.grossProfit + m.grossProfit,
        expenses: acc.expenses + m.expenses,
        shrinkage: acc.shrinkage + m.shrinkage,
        surplus: acc.surplus + m.surplus,
        netProfit: acc.netProfit + m.netProfit,
      }),
      {
        salesCount: 0,
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        expenses: 0,
        shrinkage: 0,
        surplus: 0,
        netProfit: 0,
      }
    );

    return { months, totals };
  },
};

export default reportService;
