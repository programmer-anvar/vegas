import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import ApiError from '#utils/ApiError.js';

const MINUTE = 60 * 1000;

const createLimiter = ({ windowMs, limit, message, ...options }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      const resetTime = req.rateLimit?.resetTime;
      const minutes = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / MINUTE))
        : Math.ceil(windowMs / MINUTE);
      next(new ApiError(429, `${message} ${minutes} daqiqadan keyin qayta urinib ko'ring.`));
    },
    ...options,
  });

const normalizeEmail = (req) =>
  String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 254);

export const loginIpLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 40,
  message: "Bu manzildan juda ko'p muvaffaqiyatsiz kirish urinishi bo'ldi.",
  skipSuccessfulRequests: true,
});

export const loginAccountLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 8,
  message: "Bu hisob uchun juda ko'p noto'g'ri urinish bo'ldi.",
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${normalizeEmail(req)}`,
});

export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 20,
  message: "Juda ko'p ro'yxatdan o'tish so'rovi yuborildi.",
  skipFailedRequests: true,
});
