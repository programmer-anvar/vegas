import Joi from 'joi';

export const addItem = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  variantId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(20).default(1),
});

export const updateItem = Joi.object({
  quantity: Joi.number().integer().min(0).max(20).required(),
});
