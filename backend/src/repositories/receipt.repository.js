import Receipt from '#models/Receipt.model.js';

const receiptRepository = {
  create: async (data, session) => {
    const [receipt] = await Receipt.create([data], { session });
    return receipt;
  },

  findByNumber: (receiptNumber) =>
    Receipt.findOne({ receiptNumber }).populate('createdBy', 'fullName'),

  findAll: async ({ filter = {}, page = 1, limit = 20 }) => {
    const [items, total, sumRows] = await Promise.all([
      Receipt.find(filter)
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Receipt.countDocuments(filter),
      Receipt.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
    ]);

    return { items, total, totalCost: sumRows[0]?.total ?? 0 };
  },

  existsWithProduct: (productId) => Receipt.exists({ 'items.product': productId }),
};

export default receiptRepository;
