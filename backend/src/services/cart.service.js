import cartRepository from '#repositories/cart.repository.js';
import productRepository from '#repositories/product.repository.js';
import ApiError from '#utils/ApiError.js';

const MAX_QUANTITY = 20;

const emptyCart = () => ({ items: [], total: 0, itemsCount: 0 });

const buildView = async (userId) => {
  const cart = await cartRepository.findByUser(userId);
  if (!cart) return emptyCart();

  const items = [];
  const staleIds = [];

  for (const item of cart.items) {
    const product = item.product;
    const variant = product?.isActive ? product.variants.id(item.variantId) : null;

    if (!variant) {
      staleIds.push(item._id);
      continue;
    }

    items.push({
      id: item._id,
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0],
      },
      variant: { id: variant._id, color: variant.color, size: variant.size },
      quantity: item.quantity,
      price: item.priceAtAdd,
      currentPrice: product.finalPrice,
      priceChanged: item.priceAtAdd !== product.finalPrice,
      subtotal: item.priceAtAdd * item.quantity,
      available: variant.stock,
      inStock: variant.stock >= item.quantity,
    });
  }

  if (staleIds.length > 0) {
    await cartRepository.pullItems(userId, staleIds);
  }

  return {
    items,
    total: items.reduce((sum, i) => sum + i.subtotal, 0),
    itemsCount: items.length,
  };
};

const cartService = {
  getCart: (userId) => buildView(userId),

  async addItem(userId, { productId, variantId, quantity }) {
    const product = await productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Mahsulot topilmadi');
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      throw ApiError.badRequest("Tanlangan rang/o'lcham mavjud emas");
    }

    const cart = await cartRepository.findOrCreate(userId);
    const existing = cart.items.find(
      (i) => i.product.equals(product._id) && i.variantId.equals(variant._id)
    );

    const total = (existing?.quantity ?? 0) + quantity;
    if (total > variant.stock) {
      throw ApiError.badRequest(`Omborda faqat ${variant.stock} dona qolgan`);
    }
    if (total > MAX_QUANTITY) {
      throw ApiError.badRequest(
        `Bitta mahsulotdan ko'pi bilan ${MAX_QUANTITY} dona buyurtma qilish mumkin`
      );
    }

    if (existing) {
      await cartRepository.setItemQuantity(userId, existing._id, total);
    } else {
      await cartRepository.addItem(userId, {
        product: product._id,
        variantId: variant._id,
        quantity,
        priceAtAdd: product.finalPrice,
      });
    }

    return buildView(userId);
  },

  async updateItem(userId, itemId, quantity) {
    const cart = await cartRepository.findByUser(userId);
    const item = cart?.items.id(itemId);
    if (!item) {
      throw ApiError.notFound('Savatchada bunday qator topilmadi');
    }

    if (quantity === 0) {
      await cartRepository.pullItems(userId, [item._id]);
      return buildView(userId);
    }

    const product = item.product;
    const variant = product?.isActive ? product.variants.id(item.variantId) : null;
    if (!variant) {
      throw ApiError.badRequest('Bu mahsulot endi mavjud emas, savatchadan olib tashlang');
    }
    if (quantity > variant.stock) {
      throw ApiError.badRequest(`Omborda faqat ${variant.stock} dona qolgan`);
    }

    await cartRepository.setItemQuantity(userId, item._id, quantity);
    return buildView(userId);
  },

  async removeItem(userId, itemId) {
    const result = await cartRepository.removeItem(userId, itemId);
    if (result.matchedCount === 0) {
      throw ApiError.notFound('Savatchada bunday qator topilmadi');
    }
    return buildView(userId);
  },
  async clear(userId) {
    await cartRepository.clearItems(userId);
    return buildView(userId);
  },
};

export default cartService;
