import Expense from '#models/Expense.model.js';

const expenseRepository = {
  create: (data) => Expense.create(data),

  updateById: (id, data) =>
    Expense.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }),

  deleteById: (id) => Expense.findByIdAndDelete(id),

  findAll: async ({ filter = {}, page = 1, limit = 20 }) => {
    const [items, total, sumRows] = await Promise.all([
      Expense.find(filter)
        .populate('createdBy', 'fullName')
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return { items, total, totalAmount: sumRows[0]?.total ?? 0 };
  },

  aggregateByCategory: (from, to) =>
    Expense.aggregate([
      { $match: { date: { $gte: from, $lt: to } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),

  aggregateByMonth: (from, to) =>
    Expense.aggregate([
      { $match: { date: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'Asia/Tashkent' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
};

export default expenseRepository;
