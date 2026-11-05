import crypto from 'node:crypto';
import mongoose from 'mongoose';
import productRepository from '#repositories/product.repository.js';
import stockCountRepository from '#repositories/stockCount.repository.js';
import ApiError from '#utils/ApiError.js';
import { monthRangeTashkent } from '#utils/dates.js';
import { parsePagination } from '#utils/pagination.js';

const generateCountNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `SANOQ-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    if (!(await stockCountRepository.findByNumber(number))) return number;
  }
  throw ApiError.internal("Sanoq raqamini yaratib bo'lmadi, qayta urinib ko'ring");
};

const buildLines = async (items, session) => {
  const lines = [];

  for (const { barcode, counted } of items) {
    const product = await productRepository.findByBarcode(barcode, session);
    if (!product) {
      throw ApiError.badRequest(`Bu kod bo'yicha mahsulot topilmadi: ${barcode}`);
    }
    const variant = product.variants.find((v) => v.barcode === barcode);
    const unitCost = variant.costPrice ?? 0;
    const difference = counted - variant.stock;

    lines.push({
      product: product._id,
      variantId: variant._id,
      name: product.name,
      color: variant.color,
      size: variant.size,
      barcode,
      before: variant.stock,
      after: counted,
      difference,
      unitCost,
      valueDifference: difference * unitCost,
    });
  }

  return lines;
};

const summarize = (lines) => ({
  checked: lines.length,
  changed: lines.filter((l) => l.difference !== 0).length,
  totalValueDifference: lines.reduce((sum, l) => sum + l.valueDifference, 0),
});

const stockCountService = {
  async create(user, { note, type, dryRun, items }) {
    if (dryRun) {
      const lines = await buildLines(items);
      return { dryRun: true, applied: false, type, lines, summary: summarize(lines) };
    }

    const countNumber = await generateCountNumber();
    const session = await mongoose.startSession();
    let lines = [];
    let stockCount = null;

    try {
      await session.withTransaction(async () => {
        stockCount = null;
        lines = await buildLines(items, session);

        const changed = lines.filter((l) => l.difference !== 0);
        if (changed.length === 0) return;

        for (const line of changed) {
          const updated = await productRepository.setStock(
            line.product,
            line.variantId,
            line.after,
            session
          );
          if (updated.matchedCount === 0) {
            throw ApiError.internal("Omborni yangilab bo'lmadi");
          }
        }

        stockCount = await stockCountRepository.create(
          {
            countNumber,
            type,
            note: note ?? '',
            items: changed,
            totalValueDifference: changed.reduce((sum, l) => sum + l.valueDifference, 0),
            createdBy: user._id,
          },
          session
        );
      });
    } finally {
      await session.endSession();
    }

    return {
      dryRun: false,
      applied: stockCount !== null,
      type,
      stockCount,
      lines,
      summary: summarize(lines),
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
    const { items, total } = await stockCountRepository.findAll({ filter, page, limit });

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },
};

export default stockCountService;
