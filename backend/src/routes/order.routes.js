import { Router } from 'express';
import * as orderController from '#controllers/order.controller.js';
import * as orderValidation from '#validations/order.validation.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(orderValidation.create), orderController.create);
router.get('/', orderController.getMine);
router.get('/:orderNumber', orderController.getByNumber);
router.patch('/:orderNumber/cancel', orderController.cancel);

export default router;
