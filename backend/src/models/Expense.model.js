import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'ijara',
  'maosh',
  'kommunal',
  'reklama',
  'transport',
  'soliq',
  'tamirlash',
  'boshqa',
];

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
