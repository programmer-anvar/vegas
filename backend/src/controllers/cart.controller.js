import cartService from '#services/cart.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  res.status(200).json(new ApiResponse(200, cart));
};

export const addItem = async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, cart, "Mahsulot savatchaga qo'shildi"));
};

export const updateItem = async (req, res) => {
  const cart = await cartService.updateItem(req.user._id, req.params.itemId, req.body.quantity);
  res.status(200).json(new ApiResponse(200, cart, 'Savatcha yangilandi'));
};

export const removeItem = async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.itemId);
  res.status(200).json(new ApiResponse(200, cart, "Mahsulot savatchadan o'chirildi"));
};

export const clear = async (req, res) => {
  const cart = await cartService.clear(req.user._id);
  res.status(200).json(new ApiResponse(200, cart, 'Savatcha tozalandi'));
};
