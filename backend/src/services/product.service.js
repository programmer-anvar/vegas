import productRepository from '#repositories/product.repository.js';
import categoryRepository from '#repositories/category.repository.js';
import orderRepository from '#repositories/order.repository.js';
import ApiError from '#utils/ApiError.js';
import { generateBarcode } from '#utils/barcode.js';
import { deleteImages, publicIdFromUrl } from '#utils/cloudinaryImages.js';
import saleRepository from '#repositories/sale.repository.js';
import receiptRepository from '#repositories/receipt.repository.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { soldCount: -1 },
};

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toNumber = (value) => {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toPublic = (product) => {
  const data = product.toJSON();
  for (const variant of data.variants) {
    delete variant.costPrice;
    delete variant.barcode;
  }
  return data;
};

const assertBarcodesFree = async (variants, ownProductId) => {
  const codes = variants.map((v) => v.barcode).filter(Boolean);
  if (new Set(codes).size !== codes.length) {
    throw ApiError.badRequest('Bir mahsulotda shtrix-kodlar takrorlanmasligi kerak');
  }
  if (codes.length === 0) return;

  const taken = await productRepository.findByBarcodes(codes);
  const other = taken.find((p) => !ownProductId || !p._id.equals(ownProductId));
  if (other) {
    throw ApiError.conflict(`Bu shtrix-kod boshqa mahsulotda ishlatilgan: ${other.name}`);
  }
};

const productService = {
  async getCatalog(query) {
    const { category, minPrice, maxPrice, color, size, search, sort } = query;
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, 12), 50);

    const filter = { isActive: true };

    if (category) {
      const found = await categoryRepository.findBySlug(String(category));
      if (!found) {
        throw ApiError.notFound('Kategoriya topilmadi');
      }
      filter.category = found._id;
    }

    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }

    if (color || size) {
      const match = {};
      if (color) match.color = String(color);
      if (size) match.size = String(size);
      filter.variants = { $elemMatch: match };
    }

    if (search) {
      filter.$text = { $search: String(search) };
    }

    const sortBy = Object.hasOwn(SORT_OPTIONS, sort) ? SORT_OPTIONS[sort] : SORT_OPTIONS.newest;

    const { items, total } = await productRepository.findWithFilters({
      filter,
      sort: sortBy,
      page,
      limit,
    });

    return {
      items: items.map(toPublic),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Mahsulot topilmadi');
    }
    return toPublic(product);
  },

  async getBestSellers(limit) {
    const products = await productRepository.findBestSellers(Math.min(toPositiveInt(limit, 8), 20));
    return products.map(toPublic);
  },

  async create(data, imageUrls) {
    if (imageUrls.length === 0) {
      throw ApiError.badRequest('Kamida bitta rasm yuklang');
    }

    const category = await categoryRepository.findById(data.category);
    if (!category) {
      throw ApiError.badRequest('Kategoriya topilmadi');
    }

    const existing = await productRepository.findBySlug(data.slug);
    if (existing) {
      throw ApiError.conflict('Bu slug bilan mahsulot allaqachon mavjud');
    }

    await assertBarcodesFree(data.variants);

    return productRepository.create({ ...data, images: imageUrls });
  },

  async update(id, data, newImageUrls) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Mahsulot topilmadi');
    }

    if (data.slug && data.slug !== product.slug) {
      const existing = await productRepository.findBySlug(data.slug);
      if (existing) {
        throw ApiError.conflict('Bu slug bilan mahsulot allaqachon mavjud');
      }
    }

    if (data.category) {
      const category = await categoryRepository.findById(data.category);
      if (!category) {
        throw ApiError.badRequest('Kategoriya topilmadi');
      }
    }

    const { removeImages = [], ...fields } = data;

    if (fields.variants) {
      fields.variants = fields.variants.map((incoming) => {
        if (!incoming._id) {
          return {
            ...incoming,
            barcode: incoming.barcode ?? generateBarcode(),
            costPrice: incoming.costPrice ?? 0,
          };
        }
        const existing = product.variants.id(incoming._id);
        if (!existing) {
          throw ApiError.badRequest('Tanlangan variant bu mahsulotga tegishli emas');
        }
        return { ...existing.toObject(), ...incoming };
      });
      await assertBarcodesFree(fields.variants, product._id);
    }

    const notOwned = removeImages.filter((url) => !product.images.includes(url));
    if (notOwned.length > 0) {
      throw ApiError.badRequest('Olib tashlanadigan rasm bu mahsulotga tegishli emas');
    }

    const images = [
      ...product.images.filter((url) => !removeImages.includes(url)),
      ...newImageUrls,
    ];
    if (images.length === 0) {
      throw ApiError.badRequest("Mahsulotda kamida bitta rasm bo'lishi kerak");
    }
    if (images.length > 5) {
      throw ApiError.badRequest("Mahsulotda 5 tadan ortiq rasm bo'lishi mumkin emas");
    }

    const updated = await productRepository.updateById(id, { ...fields, images });

    await deleteImages(removeImages.map(publicIdFromUrl));

    return updated;
  },

  async remove(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Mahsulot topilmadi');
    }

    const [inOrders, inSales, inReceipts] = await Promise.all([
      orderRepository.existsWithProduct(id),
      saleRepository.existsWithProduct(id),
      receiptRepository.existsWithProduct(id),
    ]);
    if (inOrders || inSales || inReceipts) {
      await productRepository.updateById(id, { isActive: false });
      return { archived: true };
    }

    await productRepository.deleteById(id);
    await deleteImages(product.images.map(publicIdFromUrl));
    return { archived: false };
  },
};

export default productService;
