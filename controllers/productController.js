import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const category = req.query.category
    ? { category: req.query.category }
    : {};

  const count = await Product.countDocuments({ ...keyword, ...category });
  const products = await Product.find({ ...keyword, ...category })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('seller', 'name avatar');

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'seller',
    'name avatar bio'
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
      await deleteImage(image.public_id);
    }

    await product.remove();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;

  const product = new Product({
    name,
    description,
    price,
    category,
    stock,
    seller: req.user._id,
    images: [],
  });

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadImage(file.path);
      product.images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
  }

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized');
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;

    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of product.images) {
        await deleteImage(image.public_id);
      }

      // Upload new images
      product.images = [];
      for (const file of req.files) {
        const result = await uploadImage(file.path);
        product.images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .sort({ ratings: -1 })
    .limit(3)
    .populate('seller', 'name avatar');

  res.json(products);
});

// @desc    Get seller products
// @route   GET /api/products/seller/:id
// @access  Public
const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.params.id }).populate(
    'seller',
    'name avatar'
  );
  res.json(products);
});

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getSellerProducts,
};