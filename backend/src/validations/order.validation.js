import Joi from 'joi';
import { ORDER_STATUSES } from '#models/Order.model.js';

export const create = Joi.object({
  shippingAddress: Joi.object({
    region: Joi.string().required(),
    district: Joi.string().required(),
    street: Joi.string().required(),
  }).required(),
  deliveryMethod: Joi.string().valid('kuryer', 'punkt').default('kuryer'),
  paymentMethod: Joi.string().valid('click', 'payme', 'uzcard', 'naqd').required(),
});

export const updateStatus = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUSES)
    .required(),
});
