import mongoose from 'mongoose';
import { generateBarcode } from '#utils/barcode.js';

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    colorHex: { type: String },
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String },
    barcode: { type: String, trim: true, default: generateBarcode },
    costPrice: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    images: [{ type: String, required: true }],
    variants: [variantSchema],
    tags: [{ type: String }],
    reviews: [reviewSchema],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('finalPrice').get(function () {
  if (!this.discountPercent) return this.price;
  return Math.round(this.price * (1 - this.discountPercent / 100));
});

productSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

productSchema.index({ name: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ 'variants.barcode': 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
