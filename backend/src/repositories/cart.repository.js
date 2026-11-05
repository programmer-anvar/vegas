import Cart from '#models/Cart.model.js';

const cartRepository = {
  findByUser: (userId, session) =>
    Cart.findOne({ user: userId })
      .populate('items.product', 'name slug images price discountPercent variants isActive')
      .session(session ?? null),

  findOrCreate: (userId) =>
    Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { items: [] } },
      { upsert: true, returnDocument: 'after' }
    ),

  addItem: (userId, item) => Cart.updateOne({ user: userId }, { $push: { items: item } }),

  setItemQuantity: (userId, itemId, quantity) =>
    Cart.updateOne(
      { user: userId, 'items._id': itemId },
      { $set: { 'items.$.quantity': quantity } }
    ),

  pullItems: (userId, itemIds) =>
    Cart.updateOne({ user: userId }, { $pull: { items: { _id: { $in: itemIds } } } }),

  removeItem: (userId, itemId) =>
    Cart.updateOne({ user: userId, 'items._id': itemId }, { $pull: { items: { _id: itemId } } }),

  clearItems: (userId, session) =>
    Cart.findOneAndUpdate({ user: userId }, { items: [] }, { returnDocument: 'after', session }),
};

export default cartRepository;
