import expenseRepository from '#repositories/expense.repository.js';
import { EXPENSE_CATEGORIES } from '#models/Expense.model.js';
import ApiError from '#utils/ApiError.js';
import { monthRangeTashkent } from '#utils/dates.js';
import { parsePagination } from '#utils/pagination.js';

const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

const assertNotFuture = (date) => {
  if (date.getTime() > Date.now() + MAX_FUTURE_MS) {
    throw ApiError.badRequest("Kelajak sanasi kiritib bo'lmaydi");
  }
};

const expenseService = {
  async create(user, data) {
    const date = data.date ?? new Date();
    assertNotFuture(date);
    return expenseRepository.create({ ...data, date, createdBy: user._id });
  },

  async list(query) {
    const filter = {};

    if (query.category) {
      if (!EXPENSE_CATEGORIES.includes(query.category)) {
        throw ApiError.badRequest("Noto'g'ri kategoriya");
      }
      filter.category = query.category;
    }

    if (query.month) {
      const range = monthRangeTashkent(query.month);
      if (!range) {
        throw ApiError.badRequest("Oy formati noto'g'ri, masalan: 2026-11");
      }
      filter.date = { $gte: range.from, $lt: range.to };
    }

    const { page, limit } = parsePagination(query);
    const { items, total, totalAmount } = await expenseRepository.findAll({ filter, page, limit });

    return {
      items,
      totalAmount,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async update(id, data) {
    if (data.date) assertNotFuture(data.date);

    const updated = await expenseRepository.updateById(id, data);
    if (!updated) {
      throw ApiError.notFound('Rasxod topilmadi');
    }
    return updated;
  },

  async remove(id) {
    const deleted = await expenseRepository.deleteById(id);
    if (!deleted) {
      throw ApiError.notFound('Rasxod topilmadi');
    }
  },
};

export default expenseService;
