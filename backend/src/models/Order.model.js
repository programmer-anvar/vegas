import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'yangi',
  'qabul_qilindi',
  'yuborildi',
  'yetkazildi',
  'bekor_qilindi',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    image: { type: String },
    color: { type: String },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],

    shippingAddress: {
      region: { type: String, required: true },
      district: { type: String, required: true },
      street: { type: String, required: true },
    },

    deliveryMethod: { type: String, enum: ['kuryer', 'punkt'], default: 'kuryer' },
    itemsTotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['click', 'payme', 'uzcard', 'naqd'], required: true },
    paymentStatus: {
      type: String,
      enum: ['kutilmoqda', 'tolandi', 'bekor_qilindi'],
      default: 'kutilmoqda',
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'yangi' },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
