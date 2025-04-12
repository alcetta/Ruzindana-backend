import express from 'express';
import {
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserAvatar,
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.route('/').get(protect, admin, getUsers);
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
    .put(protect, admin, updateUser);
  
  router
    .route('/:id/avatar')
    .post(protect, admin, upload.single('avatar'), updateUserAvatar);
  
router.route('/avatar').put(protect, upload.single('avatar'), updateUserAvatar);

export default router;