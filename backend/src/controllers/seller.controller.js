import sellerService from '#services/seller.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const create = async (req, res) => {
  const seller = await sellerService.create(req.body);
  res.status(201).json(new ApiResponse(201, seller, "Sotuvchi qo'shildi"));
};

export const list = async (req, res) => {
  const sellers = await sellerService.list();
  res.status(200).json(new ApiResponse(200, sellers));
};

export const update = async (req, res) => {
  const seller = await sellerService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, seller, "Sotuvchi ma'lumoti yangilandi"));
};
