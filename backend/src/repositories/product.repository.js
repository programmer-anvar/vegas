import Product from '#models/Product.model.js';

const productRepository = {
  create: (data) => Product.create(data),

  findById: (id) => Product.findById(id).populate('category', 'name slug'),

  findBySlug: (slug) => Product.findOne({ slug }).populate('category', 'name slug'),

  updateById: (id, data) =>
    Product.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }),

  deleteById: (id) => Product.findByIdAndDelete(id),

  findWithFilters: async ({ filter = {}, sort = { createdAt: -1 }, page = 1, limit = 12 }) => {
    const query = Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const [items, total] = await Promise.all([query.exec(), Product.countDocuments(filter)]);

    return { items, total };
  },

  findBestSellers: (limit = 8) =>
    Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(limit),

  incrementSoldCount: (id, quantity) =>
    Product.findByIdAndUpdate(id, { $inc: { soldCount: quantity } }),

  decrementStock: (productId, variantId, quantity) =>
    Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': -quantity } }
    ),

  reserveStock: (productId, variantId, quantity, session) =>
    Product.updateOne(
      {
        _id: productId,
        isActive: true,
        variants: { $elemMatch: { _id: variantId, stock: { $gte: quantity } } },
      },
      { $inc: { 'variants.$.stock': -quantity, soldCount: quantity } },
      { session }
    ),

  releaseStock: (productId, variantId, quantity, session) =>
    Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': quantity, soldCount: -quantity } },
      { session }
    ),

  receiveStock: (productId, variantId, quantity, costPrice, session) =>
    Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': quantity }, $set: { 'variants.$.costPrice': costPrice } },
      { session }
    ),
  setStock: (productId, variantId, quantity, session) =>
    Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $set: { 'variants.$.stock': quantity } },
      { session }
    ),

  findByBarcode: (barcode, session) =>
    Product.findOne({ 'variants.barcode': barcode }).session(session ?? null),

  findByBarcodes: (codes) =>
    Product.find({ 'variants.barcode': { $in: codes } }).select('name slug'),
};

export default productRepository;
