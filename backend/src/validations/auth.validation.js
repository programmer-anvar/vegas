import Joi from 'joi';

export const register = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?\d{9,13}$/)
    .allow('', null),
  password: Joi.string().min(6).max(64).required(),
});

export const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
