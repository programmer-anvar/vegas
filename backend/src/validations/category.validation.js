import Joi from 'joi';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const create = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().pattern(slugPattern).required(),
  parent: Joi.string().hex().length(24).allow(null),
  isActive: Joi.boolean(),
});

export const update = Joi.object({
  name: Joi.string().min(2).max(100),
  slug: Joi.string().pattern(slugPattern),
  parent: Joi.string().hex().length(24).allow(null),
  isActive: Joi.boolean(),
}).min(1);
