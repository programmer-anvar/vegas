import Joi from 'joi';
import { SALE_PAYMENT_METHODS } from '#models/Sale.model.js';

const item = Joi.object({
  barcode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9-]{4,32}$/)
    .required(),
  quantity: Joi.number().integer().min(1).max(100).default(1),
});

export const create = Joi.object({
  items: Joi.array().items(item).min(1).max(50).required(),
  paymentMethod: Joi.string()
    .valid(...SALE_PAYMENT_METHODS)
    .required(),
  discount: Joi.number().integer().min(0).default(0),
});

export const cancel = Joi.object({
  reason: Joi.string().trim().max(300).allow(''),
});
