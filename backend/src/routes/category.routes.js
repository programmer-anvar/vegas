import { Router } from 'express';
import * as categoryController from '#controllers/category.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { authorize } from '#middlewares/role.middleware.js';
import * as categoryValidation from '#validations/category.validation.js';

const router = Router();

router.get('/', categoryController.getAll);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(categoryValidation.create),
  categoryController.create
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(categoryValidation.update),
  categoryController.update
);
router.delete('/:id', authenticate, authorize('admin'), categoryController.remove);

export default router;
