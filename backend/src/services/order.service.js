import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ORDER_STATUSES } from '#models/Order.model.js';
import cartRepository from '#repositories/cart.repository.js';
import orderRepository from '#repositories/order.repository.js';
import productRepository from '#repositories/product.repository.js';
import paymentService from '#services/payment.service.js';
import ApiError from '#utils/ApiError.js';
import { parsePagination } from '#utils/pagination.js';

const DELIVERY_FEE = 25000;
const FREE_DELIVERY_FROM = 500000;

const TRANSITIONS = {
  yangi: ['qabul_qilindi', 'bekor_qilindi'],
  qabul_qilindi: ['yuborildi', 'bekor_qilindi'],
  yuborildi: ['yetkazildi'],
  yetkazildi: [],
  bekor_qilindi: [],
};

const generateOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `VEGAS-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    if (!(await orderRepository.findByOrderNumber(number))) return number;
  }
  throw ApiError.internal("Buyurtma raqamini yaratib bo'lmadi, qayta urinib ko'ring");
};

const cancelWithRestock = async (order, allowedFrom) => {
  const session = await mongoose.startSession();
  let cancelled;

  try {
    await session.withTransaction(async () => {
      const paymentChange =
        order.paymentStatus === 'kutilmoqda' ? { paymentStatus: 'bekor_qilindi' } : {};

      cancelled = await orderRepository.transition(
        order._id,
        allowedFrom,
        'bekor_qilindi',
        paymentChange,
        session
      );
      if (!cancelled) {
        throw ApiError.conflict("Buyurtma holati o'zgargan, sahifani yangilang");
      }

      for (const item of order.items) {
        const released = await productRepository.releaseStock(
          item.product,
          item.variantId,
          item.quantity,
          session
        );
        if (released.matchedCount === 0) {
          throw ApiError.internal("Qoldiqni qaytarib bo'lmadi");
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return cancelled;
};

const orderService = {
  async createOrder(userId, { shippingAddress, deliveryMethod, paymentMethod }) {
    const orderNumber = await generateOrderNumber();
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        const cart = await cartRepository.findByUser(userId, session);
        if (!cart || cart.items.length === 0) {
          throw ApiError.badRequest("Savatcha bo'sh");
        }

        const items = [];
        for (const item of cart.items) {
          const product = item.product;
          const variant = product?.isActive ? product.variants.id(item.variantId) : null;
          if (!variant) {
            throw ApiError.badRequest(
              "Savatchadagi ba'zi mahsulotlar endi mavjud emas, savatchani yangilang"
            );
          }

          const reserved = await productRepository.reserveStock(
            product._id,
            variant._id,
            item.quantity,
            session
          );
          if (reserved.matchedCount === 0) {
            throw ApiError.badRequest(
              `"${product.name}" (${variant.color}, ${variant.size}) dan yetarli qoldiq yo'q`
            );
          }

          items.push({
            product: product._id,
            variantId: variant._id,
            name: product.name,
            image: product.images[0],
            color: variant.color,
            size: variant.size,
            quantity: item.quantity,
            price: product.finalPrice,
          });
        }

        const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const deliveryFee =
          deliveryMethod === 'kuryer' && itemsTotal < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0;

        order = await orderRepository.create(
          {
            orderNumber,
            user: userId,
            items,
            shippingAddress,
            deliveryMethod,
            itemsTotal,
            deliveryFee,
            totalAmount: itemsTotal + deliveryFee,
            paymentMethod,
            statusHistory: [{ status: 'yangi' }],
          },
          session
        );

        await cartRepository.clearItems(userId, session);
      });
    } finally {
      await session.endSession();
    }

    const payment = await paymentService.createPayment(order);
    return { order, payment };
  },

  getUserOrders: (userId) => orderRepository.findByUser(userId),

  async getOrderByNumber(orderNumber, user) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    const isOwner = order?.user.equals(user._id);
    if (!order || (!isOwner && user.role !== 'admin')) {
      throw ApiError.notFound('Buyurtma topilmadi');
    }
    return order;
  },

  async cancelOrder(orderNumber, user) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order || !order.user.equals(user._id)) {
      throw ApiError.notFound('Buyurtma topilmadi');
    }

    if (order.status === 'bekor_qilindi') {
      throw ApiError.badRequest('Buyurtma allaqachon bekor qilingan');
    }
    if (order.status !== 'yangi') {
      throw ApiError.badRequest(
        'Buyurtma qabul qilingan, uni faqat administrator bekor qila oladi'
      );
    }

    return cancelWithRestock(order, ['yangi']);
  },

  async listAll(query) {
    const { status } = query;
    if (status && !ORDER_STATUSES.includes(status)) {
      throw ApiError.badRequest("Noto'g'ri status");
    }

    const { page, limit } = parsePagination(query);
    const { items, total } = await orderRepository.findAll({
      filter: status ? { status } : {},
      page,
      limit,
    });

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async updateStatus(orderNumber, newStatus) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw ApiError.notFound('Buyurtma topilmadi');
    }

    if (!TRANSITIONS[order.status].includes(newStatus)) {
      throw ApiError.badRequest(
        `"${order.status}" holatidan "${newStatus}" holatiga o'tib bo'lmaydi`
      );
    }

    if (newStatus === 'bekor_qilindi') {
      return cancelWithRestock(order, [order.status]);
    }

    const cashCollected = newStatus === 'yetkazildi' && order.paymentMethod === 'naqd';
    const updated = await orderRepository.transition(
      order._id,
      [order.status],
      newStatus,
      cashCollected ? { paymentStatus: 'tolandi' } : {}
    );
    if (!updated) {
      throw ApiError.conflict("Buyurtma holati o'zgargan, sahifani yangilang");
    }
    return updated;
  },
};

export default orderService;
