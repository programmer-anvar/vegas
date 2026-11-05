import receiptService from '#services/receipt.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const create = async (req, res) => {
  const result = await receiptService.create(req.user, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Tovar kirimi qabul qilindi'));
};

export const list = async (req, res) => {
  const result = await receiptService.list(req.query);
  res.status(200).json(new ApiResponse(200, result));
};

export const getByNumber = async (req, res) => {
  const receipt = await receiptService.getByNumber(req.params.receiptNumber);
  res.status(200).json(new ApiResponse(200, receipt));
};
