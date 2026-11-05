import { Router } from 'express';
import * as cartController from '#controllers/cart.controller.js';
import * as cartValidation from '#validations/cart.validation.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate(cartValidation.addItem), cartController.addItem);
router.patch('/items/:itemId', validate(cartValidation.updateItem), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clear);

export default router;
