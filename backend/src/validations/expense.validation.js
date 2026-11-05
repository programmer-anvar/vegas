import Joi from 'joi';
import { EXPENSE_CATEGORIES } from '#models/Expense.model.js';

const category = Joi.string().valid(...EXPENSE_CATEGORIES);
const amount = Joi.number().integer().min(1).max(10000000000);
const date = Joi.date().iso();
const note = Joi.string().trim().max(500).allow('');

export const create = Joi.object({
  category: category.required(),
  amount: amount.required(),
  date,
  note,
});

export const update = Joi.object({ category, amount, date, note }).min(1);
