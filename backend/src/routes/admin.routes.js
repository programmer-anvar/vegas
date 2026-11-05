import { Router } from 'express';
import * as orderController from '#controllers/order.controller.js';
import * as dashboardController from '#controllers/dashboard.controller.js';
import * as sellerController from '#controllers/seller.controller.js';
import * as expenseController from '#controllers/expense.controller.js';
import * as reportController from '#controllers/report.controller.js';
import * as receiptController from '#controllers/receipt.controller.js';
import * as saleController from '#controllers/sale.controller.js';
import * as orderValidation from '#validations/order.validation.js';
import * as sellerValidation from '#validations/seller.validation.js';
import * as expenseValidation from '#validations/expense.validation.js';
import * as receiptValidation from '#validations/receipt.validation.js';
import * as saleValidation from '#validations/sale.validation.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { authorize } from '#middlewares/role.middleware.js';
import * as stockCountController from '#controllers/stockCount.controller.js';
import * as stockCountValidation from '#validations/stockCount.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', dashboardController.getDashboard);

router.get('/reports/daily', reportController.daily);
router.get('/reports/monthly', reportController.monthly);
router.get('/reports/months', reportController.months);

router.get('/orders', orderController.listAll);
router.patch(
  '/orders/:orderNumber/status',
  validate(orderValidation.updateStatus),
  orderController.updateStatus
);

router.get('/sellers', sellerController.list);
router.post('/sellers', validate(sellerValidation.create), sellerController.create);
router.patch('/sellers/:id', validate(sellerValidation.update), sellerController.update);

router.get('/expenses', expenseController.list);
router.post('/expenses', validate(expenseValidation.create), expenseController.create);
router.patch('/expenses/:id', validate(expenseValidation.update), expenseController.update);
router.delete('/expenses/:id', expenseController.remove);

router.get('/receipts', receiptController.list);
router.post('/receipts', validate(receiptValidation.create), receiptController.create);
router.get('/receipts/:receiptNumber', receiptController.getByNumber);

router.patch('/sales/:saleNumber/cancel', validate(saleValidation.cancel), saleController.cancel);
router.get('/stock-counts', stockCountController.list);
router.post('/stock-counts', validate(stockCountValidation.create), stockCountController.create);

export default router;
