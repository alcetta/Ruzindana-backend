import express from 'express';
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.route('/register').post(registerUser);
router.post('/login', authUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;