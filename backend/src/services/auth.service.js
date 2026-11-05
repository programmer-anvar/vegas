import userRepository from '#repositories/user.repository.js';
import ApiError from '#utils/ApiError.js';
import { generateAccessToken, generateRefreshToken } from '#utils/generateTokens.js';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '#config/env.js';

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

const authService = {
  async register({ fullName, email, phone, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('Bu email bilan foydalanuvchi allaqachon mavjud');
    }

    const user = await userRepository.create({ fullName, email, phone, password });

    return {
      user: sanitizeUser(user),
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
    };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw ApiError.unauthorized("Email yoki parol noto'g'ri");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized("Email yoki parol noto'g'ri");
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Hisobingiz bloklangan');
    }

    return {
      user: sanitizeUser(user),
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
    };
  },

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token topilmadi');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch {
      throw ApiError.unauthorized('Refresh token yaroqsiz yoki muddati tugagan');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Foydalanuvchi topilmadi yoki bloklangan');
    }

    return generateAccessToken(user);
  },
};

export default authService;
