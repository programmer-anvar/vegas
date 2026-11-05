import Joi from 'joi';
import { STOCK_COUNT_TYPES } from '#models/StockCount.model.js';

const item = Joi.object({
  barcode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9-]{4,32}$/)
    .required(),
  counted: Joi.number().integer().min(0).max(100000).required(),
});

export const create = Joi.object({
  type: Joi.string()
    .valid(...STOCK_COUNT_TYPES)
    .default('inventarizatsiya'),
  note: Joi.string().trim().max(500).allow(''),
  dryRun: Joi.boolean().default(false),
  items: Joi.array().items(item).min(1).max(500).unique('barcode').required(),
});
