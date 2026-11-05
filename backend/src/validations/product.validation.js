import Joi from 'joi';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const variantSchema = Joi.object({
  color: Joi.string().required(),
  colorHex: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .allow('', null),
  size: Joi.string().required(),
  stock: Joi.number().integer().min(0).required(),
  sku: Joi.string().allow('', null),
  barcode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9-]{4,32}$/),
  costPrice: Joi.number().min(0),
});

export const create = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  slug: Joi.string().pattern(slugPattern).required(),
  description: Joi.string().allow('', null),
  category: Joi.string().hex().length(24).required(),
  price: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(90).default(0),
  variants: Joi.array().items(variantSchema).min(1).required(),
  tags: Joi.array().items(Joi.string()),
});

export const update = Joi.object({
  name: Joi.string().min(2).max(200),
  slug: Joi.string().pattern(slugPattern),
  description: Joi.string().allow('', null),
  category: Joi.string().hex().length(24),
  price: Joi.number().min(0),
  discountPercent: Joi.number().min(0).max(90),
  variants: Joi.array()
    .items(variantSchema.keys({ _id: Joi.string().hex().length(24) }))
    .min(1),
  tags: Joi.array().items(Joi.string()),
  isActive: Joi.boolean(),
  removeImages: Joi.array().items(Joi.string()),
});
