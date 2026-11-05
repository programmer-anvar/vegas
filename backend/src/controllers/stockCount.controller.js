import stockCountService from '#services/stockCount.service.js';
import ApiResponse from '#utils/ApiResponse.js';

const messageFor = (result) => {
  if (result.dryRun) return 'Sanoq natijasi (hali saqlanmadi)';
  if (result.applied) return 'Sanoq qabul qilindi, qoldiq yangilandi';
  return "Farq yo'q, qoldiq o'zgarmadi";
};

export const create = async (req, res) => {
  const result = await stockCountService.create(req.user, req.body);
  const status = result.applied ? 201 : 200;
  res.status(status).json(new ApiResponse(status, result, messageFor(result)));
};

export const list = async (req, res) => {
  const result = await stockCountService.list(req.query);
  res.status(200).json(new ApiResponse(200, result));
};
