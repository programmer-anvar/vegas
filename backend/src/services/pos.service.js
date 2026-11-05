import productRepository from '#repositories/product.repository.js';
import ApiError from '#utils/ApiError.js';

const BARCODE_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

const posService = {
  async scan(rawBarcode) {
    const barcode = String(rawBarcode ?? '').trim();
    if (!BARCODE_PATTERN.test(barcode)) {
      throw ApiError.badRequest("Shtrix-kod formati noto'g'ri");
    }

    const product = await productRepository.findByBarcode(barcode);
    if (!product) {
      throw ApiError.notFound("Bu kod bo'yicha mahsulot topilmadi");
    }
    if (!product.isActive) {
      throw ApiError.notFound("Bu mahsulot arxivga o'tkazilgan, sotib bo'lmaydi");
    }

    const variant = product.variants.find((v) => v.barcode === barcode);

    return {
      productId: product._id,
      variantId: variant._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      color: variant.color,
      size: variant.size,
      barcode: variant.barcode,
      listPrice: product.price,
      discountPercent: product.discountPercent,
      price: product.finalPrice,
      stock: variant.stock,
      inStock: variant.stock > 0,
    };
  },
};

export default posService;
