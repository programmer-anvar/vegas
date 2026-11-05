import Joi from 'joi';

const item = Joi.object({
  barcode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9-]{4,32}$/)
    .required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
  unitCost: Joi.number().integer().min(1).max(1000000000).required(),
});

export const create = Joi.object({
  supplier: Joi.string().trim().max(120).allow(''),
  note: Joi.string().trim().max(500).allow(''),
  items: Joi.array().items(item).min(1).max(200).unique('barcode').required(),
});
