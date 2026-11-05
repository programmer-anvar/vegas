import orderService from '#services/order.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const create = async (req, res) => {
  const { order, payment } = await orderService.createOrder(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { order, payment }, 'Buyurtma qabul qilindi'));
};

export const getMine = async (req, res) => {
  const orders = await orderService.getUserOrders(req.user._id);
  res.status(200).json(new ApiResponse(200, orders));
};

export const getByNumber = async (req, res) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber, req.user);
  res.status(200).json(new ApiResponse(200, order));
};

export const cancel = async (req, res) => {
  const order = await orderService.cancelOrder(req.params.orderNumber, req.user);
  res.status(200).json(new ApiResponse(200, order, 'Buyurtma bekor qilindi'));
};

export const listAll = async (req, res) => {
  const result = await orderService.listAll(req.query);
  res.status(200).json(new ApiResponse(200, result));
};

export const updateStatus = async (req, res) => {
  const order = await orderService.updateStatus(req.params.orderNumber, req.body.status);
  res.status(200).json(new ApiResponse(200, order, 'Buyurtma holati yangilandi'));
};
