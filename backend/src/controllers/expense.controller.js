import expenseService from '#services/expense.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const create = async (req, res) => {
  const expense = await expenseService.create(req.user, req.body);
  res.status(201).json(new ApiResponse(201, expense, "Rasxod qo'shildi"));
};

export const list = async (req, res) => {
  const result = await expenseService.list(req.query);
  res.status(200).json(new ApiResponse(200, result));
};

export const update = async (req, res) => {
  const expense = await expenseService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, expense, 'Rasxod yangilandi'));
};

export const remove = async (req, res) => {
  await expenseService.remove(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Rasxod o'chirildi"));
};
