import { Router } from 'express';
import * as authController from '#controllers/auth.controller.js';
import * as authValidation from '#validations/auth.validation.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import {
  loginAccountLimiter,
  loginIpLimiter,
  registerLimiter,
} from '#middlewares/rateLimit.middleware.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  validate(authValidation.register),
  authController.register
);
router.post(
  '/login',
  loginIpLimiter,
  loginAccountLimiter,
  validate(authValidation.login),
  authController.login
);
router.get('/me', authenticate, authController.me);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
