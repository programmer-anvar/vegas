import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '#config/env.js';

export function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user._id }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}
