import StockCount from '#models/StockCount.model.js';

const COUNTS_TOWARD_PROFIT = 'inventarizatsiya';

const lossOf = {
  $cond: [{ $lt: ['$items.valueDifference', 0] }, { $multiply: ['$items.valueDifference', -1] }, 0],
};
const gainOf = {
  $cond: [{ $gt: ['$items.valueDifference', 0] }, '$items.valueDifference', 0],
};

const periodMatch = (from, to) => ({
  $match: { type: COUNTS_TOWARD_PROFIT, createdAt: { $gte: from, $lt: to } },
});

const stockCountRepository = {
  create: async (data, session) => {
    const [stockCount] = await StockCount.create([data], { session });
    return stockCount;
  },

  findByNumber: (countNumber) => StockCount.findOne({ countNumber }),

  findAll: async ({ filter = {}, page = 1, limit = 20 }) => {
    const [items, total] = await Promise.all([
      StockCount.find(filter)
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StockCount.countDocuments(filter),
    ]);
    return { items, total };
  },

  sumByPeriod: async (from, to) => {
    const [row] = await StockCount.aggregate([
      periodMatch(from, to),
      { $unwind: '$items' },
      { $group: { _id: null, shrinkage: { $sum: lossOf }, surplus: { $sum: gainOf } } },
    ]);
    return row ?? null;
  },

  aggregateByMonth: (from, to) =>
    StockCount.aggregate([
      periodMatch(from, to),
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Tashkent' },
          },
          shrinkage: { $sum: lossOf },
          surplus: { $sum: gainOf },
        },
      },
    ]),
};

export default stockCountRepository;
