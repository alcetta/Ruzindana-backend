import express from 'express';
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getSellerProducts,
} from '../controllers/productController.js';
import { protect, seller } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, seller, upload.array('images', 5), createProduct);
router.route('/top').get(getTopProducts);
router.route('/seller/:id').get(getSellerProducts);
router
  .route('/:id')
  .get(getProductById)
  .delete(protect, seller, deleteProduct)
  .put(protect, seller, upload.array('images', 5), updateProduct);
router.route('/:id/reviews').post(protect, createProductReview);

export default router;