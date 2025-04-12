import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;