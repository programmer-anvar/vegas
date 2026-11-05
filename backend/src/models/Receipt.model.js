import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    barcode: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    supplier: { type: String, trim: true, maxlength: 120, default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    items: { type: [receiptItemSchema], validate: (items) => items.length > 0 },
    totalCost: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

receiptSchema.index({ createdAt: -1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
