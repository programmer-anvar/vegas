import { Router } from 'express';
import * as posController from '#controllers/pos.controller.js';
import * as saleController from '#controllers/sale.controller.js';
import * as saleValidation from '#validations/sale.validation.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { authorize } from '#middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin', 'seller'));

router.get('/scan/:barcode', posController.scan);

router.post('/sales', validate(saleValidation.create), saleController.create);
router.get('/sales', saleController.list);
router.get('/sales/:saleNumber', saleController.getBySaleNumber);

export default router;
