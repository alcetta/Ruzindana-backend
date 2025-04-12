import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

// @desc    Get or create chat
// @route   POST /api/chats
// @access  Private
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('UserId param not sent with request');
  }

  let isChat = await Chat.findOne({
    participants: { $all: [req.user._id, userId] },
  })
    .populate('participants', '-password')
    .populate('latestMessage');

  if (isChat) {
    res.json(isChat);
  } else {
    const chatData = {
      participants: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'participants',
        '-password'
      );
      res.status(201).json(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
const fetchChats = asyncHandler(async (req, res) => {
  try {
    let chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name avatar email',
    });

    res.status(200).json(chats);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Create new message
// @route   POST /api/chats/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    res.status(400);
    throw new Error('Invalid data passed into request');
  }

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    let message = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: newMessage },
      },
      { new: true }
    );

    message = await message.populate('participants', '-password');
    message = await message.populate('messages.sender', 'name avatar');

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Get all messages for a chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
const allMessages = asyncHandler(async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      'messages.sender',
      'name avatar email'
    );

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Check if user is part of the chat
    if (!chat.participants.includes(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this chat');
    }

    res.json(chat.messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export { accessChat, fetchChats, sendMessage, allMessages };