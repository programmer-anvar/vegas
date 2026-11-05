import { Router } from 'express';
import * as productController from '#controllers/product.controller.js';
import * as productValidation from '#validations/product.validation.js';
import { validate, parseJsonFields } from '#middlewares/validate.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { authorize } from '#middlewares/role.middleware.js';
import upload from '#middlewares/upload.middleware.js';

const router = Router();

router.get('/', productController.getCatalog);
router.get('/best-sellers', productController.getBestSellers);
router.get('/:slug', productController.getBySlug);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  parseJsonFields(['variants', 'tags']),
  validate(productValidation.create),
  productController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  parseJsonFields(['variants', 'tags', 'removeImages']),
  validate(productValidation.update),
  productController.update
);

router.delete('/:id', authenticate, authorize('admin'), productController.remove);

export default router;
