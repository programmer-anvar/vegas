import ApiError from '#utils/ApiError.js';
import * as logger from '#utils/logger.js';
import { env } from '#config/env.js';
import { deleteImages } from '#utils/cloudinaryImages.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Yo'l topilmadi: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  if (req.files?.length) {
    deleteImages(req.files.map((f) => f.filename));
  }

  if (res.headersSent) return next(err);

  let error = err;

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest("Ma'lumot noto'g'ri", messages);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'maydon';
    error = ApiError.conflict(`Bu ${field} allaqachon band`);
  } else if (err.name === 'CastError') {
    error = ApiError.badRequest("Noto'g'ri ID formati");
  } else if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Rasm hajmi 5 MB dan oshmasligi kerak'
        : `Fayl yuklashda xato: ${err.message}`;
    error = ApiError.badRequest(message);
  } else if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest("So'rov JSON formati noto'g'ri");
  }

  const statusCode = error.statusCode ?? 500;
  const isOperational = error.isOperational === true;

  if (!isOperational) {
    logger.error(err.stack ?? String(err));
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : 'Serverda kutilmagan xatolik yuz berdi',
    errors: error.errors ?? [],
    ...(env === 'development' && { stack: err.stack }),
  });
}
