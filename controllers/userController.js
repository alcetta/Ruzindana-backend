import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.avatar && user.avatar.public_id) {
      await deleteImage(user.avatar.public_id);
    }
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.bio = req.body.bio || user.bio;

    if (req.file) {
      if (user.avatar && user.avatar.public_id) {
        await deleteImage(user.avatar.public_id);
      }
      const result = await uploadImage(req.file.path);
      user.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateUserAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    if (req.file) {
      if (user.avatar && user.avatar.public_id) {
        await deleteImage(user.avatar.public_id);
      }
      const result = await uploadImage(req.file.path);
      user.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(400);
      throw new Error('No image uploaded');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserAvatar,
};