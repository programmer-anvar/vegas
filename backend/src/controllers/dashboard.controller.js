import dashboardService from '#services/dashboard.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const getDashboard = async (req, res) => {
  const data = await dashboardService.getDashboard();
  res.status(200).json(new ApiResponse(200, data));
};
