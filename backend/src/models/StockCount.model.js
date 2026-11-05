import mongoose from 'mongoose';

export const STOCK_COUNT_TYPES = ['inventarizatsiya', 'tuzatish'];

const stockCountItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    barcode: { type: String },
    before: { type: Number, required: true, min: 0 },
    after: { type: Number, required: true, min: 0 },
    difference: { type: Number, required: true },
    unitCost: { type: Number, min: 0, default: 0 },
    valueDifference: { type: Number, required: true },
  },
  { _id: false }
);

const stockCountSchema = new mongoose.Schema(
  {
    countNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: STOCK_COUNT_TYPES, default: 'inventarizatsiya' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    items: { type: [stockCountItemSchema], validate: (items) => items.length > 0 },
    totalValueDifference: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockCountSchema.index({ createdAt: -1 });

const StockCount = mongoose.model('StockCount', stockCountSchema);

export default StockCount;
