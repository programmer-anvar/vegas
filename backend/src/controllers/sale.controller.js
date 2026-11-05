import saleService from '#services/sale.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const create = async (req, res) => {
  const sale = await saleService.createSale(req.user, req.body);
  res.status(201).json(new ApiResponse(201, sale, 'Sotuv yakunlandi'));
};

export const list = async (req, res) => {
  const result = await saleService.list(req.user, req.query);
  res.status(200).json(new ApiResponse(200, result));
};

export const getBySaleNumber = async (req, res) => {
  const sale = await saleService.getBySaleNumber(req.params.saleNumber, req.user);
  res.status(200).json(new ApiResponse(200, sale));
};

export const cancel = async (req, res) => {
  const sale = await saleService.cancelSale(req.params.saleNumber, req.user, req.body.reason);
  res.status(200).json(new ApiResponse(200, sale, 'Chek bekor qilindi'));
};
