import reportService from '#services/report.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const monthly = async (req, res) => {
  const data = await reportService.monthly(req.query.month);
  res.status(200).json(new ApiResponse(200, data));
};

export const daily = async (req, res) => {
  const data = await reportService.daily(req.query.date);
  res.status(200).json(new ApiResponse(200, data));
};

export const months = async (req, res) => {
  const data = await reportService.months(req.query.count);
  res.status(200).json(new ApiResponse(200, data));
};
