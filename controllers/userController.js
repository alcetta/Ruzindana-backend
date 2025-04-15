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

    exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

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
// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, bio } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = new User({
    name,
    email,
    password,
    role: role || 'user',
    bio,
  });

  if (req.file) {
    const result = await uploadImage(req.file.path);
    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  const createdUser = await user.save();

  res.status(201).json({
    _id: createdUser._id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
    avatar: createdUser.avatar,
    bio: createdUser.bio,
  });
});

export {
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserAvatar,
  createUser,
};
