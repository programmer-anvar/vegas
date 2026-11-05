import Category from '#models/Category.model.js';

const categoryRepository = {
  create: (data) => Category.create(data),
  findAll: (filter = {}) => Category.find(filter).sort({ name: 1 }),
  findById: (id) => Category.findById(id),
  findBySlug: (slug) => Category.findOne({ slug }),
  updateById: (id, data) =>
    Category.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }),
  deleteById: (id) => Category.findByIdAndDelete(id),
};

export default categoryRepository;
