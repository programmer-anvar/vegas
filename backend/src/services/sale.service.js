import crypto from 'node:crypto';
import mongoose from 'mongoose';
import productRepository from '#repositories/product.repository.js';
import saleRepository from '#repositories/sale.repository.js';
import ApiError from '#utils/ApiError.js';
import { parsePagination } from '#utils/pagination.js';

const MAX_SELLER_DISCOUNT_PERCENT = 10;

const generateSaleNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `CHEK-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    if (!(await saleRepository.findBySaleNumber(number))) return number;
  }
  throw ApiError.internal("Chek raqamini yaratib bo'lmadi, qayta urinib ko'ring");
};

const toResponse = (sale, user) => {
  const data = sale.toObject();
  if (user.role !== 'admin') {
    delete data.totalCost;
    delete data.profit;
    delete data.costMissing;
    data.items = data.items.map((item) => {
      const copy = { ...item };
      delete copy.costPrice;
      return copy;
    });
  }
  return data;
};

const ownerId = (sale) => String(sale.seller?._id ?? sale.seller);

const mergeLines = (items) => {
  const merged = new Map();
  for (const { barcode, quantity } of items) {
    merged.set(barcode, (merged.get(barcode) ?? 0) + quantity);
  }
  return merged;
};

const saleService = {
  async createSale(user, { items, paymentMethod, discount }) {
    const lines = mergeLines(items);
    const saleNumber = await generateSaleNumber();
    const session = await mongoose.startSession();
    let sale;

    try {
      await session.withTransaction(async () => {
        const saleItems = [];

        for (const [barcode, quantity] of lines) {
          const product = await productRepository.findByBarcode(barcode);
          if (!product || !product.isActive) {
            throw ApiError.badRequest(`Bu kod bo'yicha sotiladigan mahsulot topilmadi: ${barcode}`);
          }
          const variant = product.variants.find((v) => v.barcode === barcode);

          const reserved = await productRepository.reserveStock(
            product._id,
            variant._id,
            quantity,
            session
          );
          if (reserved.matchedCount === 0) {
            throw ApiError.badRequest(
              `"${product.name}" (${variant.color}, ${variant.size}) dan yetarli qoldiq yo'q`
            );
          }

          saleItems.push({
            product: product._id,
            variantId: variant._id,
            name: product.name,
            color: variant.color,
            size: variant.size,
            barcode,
            quantity,
            unitPrice: product.finalPrice,
            costPrice: variant.costPrice ?? 0,
          });
        }

        const subtotal = saleItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        if (discount > subtotal) {
          throw ApiError.badRequest('Chegirma jami summadan oshib ketdi');
        }
        if (user.role === 'seller' && discount * 100 > subtotal * MAX_SELLER_DISCOUNT_PERCENT) {
          throw ApiError.forbidden(
            `Sotuvchi ko'pi bilan ${MAX_SELLER_DISCOUNT_PERCENT}% chegirma bera oladi`
          );
        }

        const totalAmount = subtotal - discount;
        const totalCost = saleItems.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);

        sale = await saleRepository.create(
          {
            saleNumber,
            seller: user._id,
            items: saleItems,
            paymentMethod,
            subtotal,
            discount,
            totalAmount,
            totalCost,
            profit: totalAmount - totalCost,
            costMissing: saleItems.some((i) => !i.costPrice),
          },
          session
        );
      });
    } finally {
      await session.endSession();
    }

    return toResponse(sale, user);
  },

  async list(user, query) {
    const { page, limit } = parsePagination(query);
    const filter = user.role === 'admin' ? {} : { seller: user._id };
    const { items, total } = await saleRepository.findAll({ filter, page, limit });

    return {
      items: items.map((sale) => toResponse(sale, user)),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getBySaleNumber(saleNumber, user) {
    const sale = await saleRepository.findBySaleNumber(saleNumber);
    if (!sale || (user.role !== 'admin' && ownerId(sale) !== String(user._id))) {
      throw ApiError.notFound('Chek topilmadi');
    }
    return toResponse(sale, user);
  },
  async cancelSale(saleNumber, user, reason) {
    const existing = await saleRepository.findBySaleNumber(saleNumber);
    if (!existing) {
      throw ApiError.notFound('Chek topilmadi');
    }
    if (existing.status === 'bekor_qilindi') {
      throw ApiError.badRequest('Chek allaqachon bekor qilingan');
    }

    const session = await mongoose.startSession();
    let cancelled;

    try {
      await session.withTransaction(async () => {
        cancelled = await saleRepository.transition(
          existing._id,
          ['yakunlandi'],
          'bekor_qilindi',
          { cancelledAt: new Date(), cancelledBy: user._id, cancelReason: reason ?? '' },
          session
        );
        if (!cancelled) {
          throw ApiError.conflict("Chek holati o'zgargan, sahifani yangilang");
        }

        for (const item of cancelled.items) {
          const released = await productRepository.releaseStock(
            item.product,
            item.variantId,
            item.quantity,
            session
          );
          if (released.matchedCount === 0) {
            throw ApiError.conflict("Mahsulot topilmadi, qoldiqni qaytarib bo'lmadi");
          }
        }
      });
    } finally {
      await session.endSession();
    }

    return toResponse(cancelled, user);
  },
};

export default saleService;
