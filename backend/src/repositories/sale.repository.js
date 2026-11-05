import Sale from '#models/Sale.model.js';

const COMPLETED = 'yakunlandi';

const saleRepository = {
  create: async (data, session) => {
    const [sale] = await Sale.create([data], { session });
    return sale;
  },

  findBySaleNumber: (saleNumber) => Sale.findOne({ saleNumber }).populate('seller', 'fullName'),

  findAll: async ({ filter = {}, page = 1, limit = 20 }) => {
    const [items, total] = await Promise.all([
      Sale.find(filter)
        .populate('seller', 'fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Sale.countDocuments(filter),
    ]);
    return { items, total };
  },

  transition: (id, fromStatuses, toStatus, extraSet = {}, session) =>
    Sale.findOneAndUpdate(
      { _id: id, status: { $in: fromStatuses } },
      { $set: { status: toStatus, ...extraSet } },
      { returnDocument: 'after', session }
    ),

  existsWithProduct: (productId) => Sale.exists({ 'items.product': productId }),

  aggregateByPayment: (from, to) =>
    Sale.aggregate([
      { $match: { status: COMPLETED, createdAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: '$totalCost' },
          discount: { $sum: '$discount' },
          costMissing: { $sum: { $cond: ['$costMissing', 1, 0] } },
        },
      },
    ]),

  aggregateByMonth: (from, to) =>
    Sale.aggregate([
      { $match: { status: COMPLETED, createdAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Tashkent' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: '$totalCost' },
        },
      },
    ]),
};

export default saleRepository;
