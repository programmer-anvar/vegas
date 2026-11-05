import categoryRepository from '#repositories/category.repository.js';
import productRepository from '#repositories/product.repository.js';
import ApiError from '#utils/ApiError.js';

const categoryService = {
  getAll: () => categoryRepository.findAll({ isActive: true }),

  async create(data) {
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) {
      throw ApiError.conflict('Bu slug bilan kategoriya allaqachon mavjud');
    }

    if (data.parent) {
      const parent = await categoryRepository.findById(data.parent);
      if (!parent) {
        throw ApiError.badRequest('Ota-kategoriya topilmadi');
      }
    }

    return categoryRepository.create(data);
  },

  async update(id, data) {
    if (data.slug) {
      const existing = await categoryRepository.findBySlug(data.slug);
      if (existing && existing._id.toString() !== id) {
        throw ApiError.conflict('Bu slug bilan kategoriya allaqachon mavjud');
      }
    }

    if (data.parent && data.parent === id) {
      throw ApiError.badRequest("Kategoriya o'zining ota-kategoriyasi bo'la olmaydi");
    }

    const category = await categoryRepository.updateById(id, data);
    if (!category) {
      throw ApiError.notFound('Kategoriya topilmadi');
    }
    return category;
  },

  async remove(id) {
    const children = await categoryRepository.findAll({ parent: id });
    if (children.length > 0) {
      throw ApiError.badRequest("Ichida kichik kategoriyalar bor, avval ularni o'chiring");
    }

    const { total } = await productRepository.findWithFilters({
      filter: { category: id },
      limit: 1,
    });
    if (total > 0) {
      throw ApiError.badRequest("Bu kategoriyada mahsulotlar bor, o'chirib bo'lmaydi");
    }

    const category = await categoryRepository.deleteById(id);
    if (!category) {
      throw ApiError.notFound('Kategoriya topilmadi');
    }
  },
};

export default categoryService;
