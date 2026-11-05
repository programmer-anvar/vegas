import authService from '#services/auth.service.js';
import ApiResponse from '#utils/ApiResponse.js';
import { env } from '#config/env.js';

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

export const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res
    .status(201)
    .json(new ApiResponse(201, { user, accessToken }, "Ro'yxatdan muvaffaqiyatli o'tildi"));
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, 'Tizimga muvaffaqiyatli kirildi'));
};

export const me = async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Foydalanuvchi ma'lumoti"));
};

export const refresh = async (req, res) => {
  const accessToken = await authService.refreshAccessToken(req.cookies?.refreshToken);
  res.status(200).json(new ApiResponse(200, { accessToken }, 'Token yangilandi'));
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env === 'production',
    sameSite: 'strict',
  });
  res.status(200).json(new ApiResponse(200, null, 'Tizimdan chiqildi'));
};
