import posService from '#services/pos.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const scan = async (req, res) => {
  const item = await posService.scan(req.params.barcode);
  res.status(200).json(new ApiResponse(200, item));
};
