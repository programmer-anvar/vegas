import crypto from 'node:crypto';
import mongoose from 'mongoose';
import productRepository from '#repositories/product.repository.js';
import receiptRepository from '#repositories/receipt.repository.js';
import ApiError from '#utils/ApiError.js';
import { monthRangeTashkent } from '#utils/dates.js';
import { parsePagination } from '#utils/pagination.js';

const generateReceiptNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `KIRIM-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    if (!(await receiptRepository.findByNumber(number))) return number;
  }
  throw ApiError.internal("Kirim raqamini yaratib bo'lmadi, qayta urinib ko'ring");
};

const averageCost = (oldStock, oldCost, quantity, unitCost) => {
  if (oldStock <= 0 || oldCost <= 0) return unitCost;
  return Math.round((oldStock * oldCost + quantity * unitCost) / (oldStock + quantity));
};

const receiptService = {
  async create(user, { supplier, note, items }) {
    const receiptNumber = await generateReceiptNumber();
    const session = await mongoose.startSession();
    let receipt;
    let stickers;

    try {
      await session.withTransaction(async () => {
        const lines = [];
        stickers = [];

        for (const { barcode, quantity, unitCost } of items) {
          const product = await productRepository.findByBarcode(barcode, session);
          if (!product) {
            throw ApiError.badRequest(`Bu kod bo'yicha mahsulot topilmadi: ${barcode}`);
          }
          const variant = product.variants.find((v) => v.barcode === barcode);

          const costPrice = averageCost(variant.stock, variant.costPrice ?? 0, quantity, unitCost);
          const updated = await productRepository.receiveStock(
            product._id,
            variant._id,
            quantity,
            costPrice,
            session
          );
          if (updated.matchedCount === 0) {
            throw ApiError.internal("Omborni yangilab bo'lmadi");
          }

          lines.push({
            product: product._id,
            variantId: variant._id,
            name: product.name,
            color: variant.color,
            size: variant.size,
            barcode,
            quantity,
            unitCost,
          });
          stickers.push({
            barcode,
            name: product.name,
            color: variant.color,
            size: variant.size,
            count: quantity,
          });
        }

        receipt = await receiptRepository.create(
          {
            receiptNumber,
            supplier: supplier ?? '',
            note: note ?? '',
            items: lines,
            totalCost: lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0),
            createdBy: user._id,
          },
          session
        );
      });
    } finally {
      await session.endSession();
    }

    return {
      receipt,
      stickers,
      totalStickers: stickers.reduce((sum, s) => sum + s.count, 0),
    };
  },

  async list(query) {
    const filter = {};

    if (query.month) {
      const range = monthRangeTashkent(query.month);
      if (!range) {
        throw ApiError.badRequest("Oy formati noto'g'ri, masalan: 2026-11");
      }
      filter.createdAt = { $gte: range.from, $lt: range.to };
    }

    const { page, limit } = parsePagination(query);
    const { items, total, totalCost } = await receiptRepository.findAll({ filter, page, limit });

    return {
      items,
      totalCost,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getByNumber(receiptNumber) {
    const receipt = await receiptRepository.findByNumber(receiptNumber);
    if (!receipt) {
      throw ApiError.notFound('Kirim topilmadi');
    }
    return receipt;
  },
};

export default receiptService;
