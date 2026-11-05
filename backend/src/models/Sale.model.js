import mongoose from 'mongoose';

export const SALE_PAYMENT_METHODS = ['naqd', 'terminal', 'otkazma'];
export const SALE_STATUSES = ['yakunlandi', 'bekor_qilindi'];

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    barcode: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, required: true, unique: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [saleItemSchema], validate: (items) => items.length > 0 },
    paymentMethod: { type: String, enum: SALE_PAYMENT_METHODS, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    profit: { type: Number, default: 0 },
    costMissing: { type: Boolean, default: false },
    status: { type: String, enum: SALE_STATUSES, default: 'yakunlandi' },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ seller: 1, createdAt: -1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
