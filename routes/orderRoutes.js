import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  getSellerOrders,
  createPayPalOrder,
  capturePayPalPayment,
} from '../controllers/orderController.js';
import { protect, admin, seller } from '../middlewares/auth.js';

const router = express.Router();

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/seller').get(protect, seller, getSellerOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/paypal/create').post(protect, createPayPalOrder);
router.route('/:id/paypal/capture').post(protect, capturePayPalPayment);

export default router;