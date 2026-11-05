import ApiError from '#utils/ApiError.js';

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden("Bu amalni bajarishga ruxsatingiz yo'q");
    }
    next();
  };
