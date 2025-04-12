import express from 'express';
import {
  accessChat,
  fetchChats,
  sendMessage,
  allMessages,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/message').post(protect, sendMessage);
router.route('/:chatId/messages').get(protect, allMessages);

export default router;