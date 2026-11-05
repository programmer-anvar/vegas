import Order from '#models/Order.model.js';

const orderRepository = {
  create: async (data, session) => {
    const [order] = await Order.create([data], { session });
    return order;
  },

  findById: (id) => Order.findById(id).populate('user', 'fullName phone email'),

  findByOrderNumber: (orderNumber) => Order.findOne({ orderNumber }),

  findByUser: (userId) => Order.find({ user: userId }).sort({ createdAt: -1 }),

  existsWithProduct: (productId) => Order.exists({ 'items.product': productId }),

  findAll: async ({ filter = {}, page = 1, limit = 20 }) => {
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'fullName phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    return { items, total };
  },

  transition: (id, fromStatuses, toStatus, extraSet = {}, session) =>
    Order.findOneAndUpdate(
      { _id: id, status: { $in: fromStatuses } },
      {
        $set: { status: toStatus, ...extraSet },
        $push: { statusHistory: { status: toStatus, changedAt: new Date() } },
      },
      { returnDocument: 'after', session }
    ),

  countByStatus: () => Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

  paidRevenueTotal: async () => {
    const [row] = await Order.aggregate([
      { $match: { paymentStatus: 'tolandi' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return row?.total ?? 0;
  },

  paidRevenueByMonth: (from) =>
    Order.aggregate([
      { $match: { paymentStatus: 'tolandi', createdAt: { $gte: from } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Tashkent' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
};

export default orderRepository;
