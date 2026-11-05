import User from '#models/User.model.js';

const userRepository = {
  create: (data) => User.create(data),

  findById: (id) => User.findById(id),

  findByEmailWithPassword: (email) => User.findOne({ email }).select('+password'),

  findByEmail: (email) => User.findOne({ email }),

  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }),

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 20 } = options;
    return User.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
  },

  count: (filter = {}) => User.countDocuments(filter),
};

export default userRepository;
