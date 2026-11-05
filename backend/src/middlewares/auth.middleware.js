import jwt from 'jsonwebtoken';
import ApiError from '#utils/ApiError.js';
import { jwt as jwtConfig } from '#config/env.js';
import userRepository from '#repositories/user.repository.js';

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token topilmadi, tizimga kiring');
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.accessSecret);
  } catch {
    throw ApiError.unauthorized('Token yaroqsiz yoki muddati tugagan');
  }

  const user = await userRepository.findById(decoded.id);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Foydalanuvchi topilmadi yoki bloklangan');
  }

  req.user = user;
  next();
};
