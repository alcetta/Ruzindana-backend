import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import paypalClient from '../config/paypal.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    // Verify all products are in stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Not enough stock for ${product.name}`);
      }
    }

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({
      path: 'orderItems.product',
      select: 'name price images seller',
      populate: {
        path: 'seller',
        select: 'name avatar',
      },
    });

  if (order) {
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      !order.orderItems.some(
        (item) => item.product.seller._id.toString() === req.user._id.toString()
      )
    ) {
      res.status(401);
      throw new Error('Not authorized');
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get orders for seller
// @route   GET /api/orders/seller
// @access  Private/Seller
const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name')
    .populate({
      path: 'orderItems.product',
      select: 'seller',
    });

  const sellerOrders = orders.filter((order) =>
    order.orderItems.some(
      (item) => item.product.seller.toString() === req.user._id.toString()
    )
  );

  res.json(sellerOrders);
});

// @desc    Create PayPal order
// @route   POST /api/orders/:id/paypal/create
// @access  Private
const createPayPalOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: order.totalPrice.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: order.itemsPrice.toFixed(2),
            },
            shipping: {
              currency_code: 'USD',
              value: order.shippingPrice.toFixed(2),
            },
            tax_total: {
              currency_code: 'USD',
              value: order.taxPrice.toFixed(2),
            },
          },
        },
        items: order.orderItems.map((item) => ({
          name: item.name,
          unit_amount: {
            currency_code: 'USD',
            value: item.price.toFixed(2),
          },
          quantity: item.quantity,
        })),
      },
    ],
    application_context: {
      brand_name: 'Marketplace',
      shipping_preference: 'SET_PROVIDED_ADDRESS',
      user_action: 'PAY_NOW',
      return_url: `${req.headers.origin}/order/${order._id}/success`,
      cancel_url: `${req.headers.origin}/order/${order._id}`,
    },
  });

  try {
    const response = await paypalClient.execute(request);
    res.json({ id: response.result.id });
  } catch (err) {
    console.error(err);
    res.status(500);
    throw new Error('PayPal order creation failed');
  }
});

// @desc    Capture PayPal payment
// @route   POST /api/orders/:id/paypal/capture
// @access  Private
const capturePayPalPayment = asyncHandler(async (req, res) => {
  const { orderID } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    res.json(capture);
  } catch (err) {
    console.error(err);
    res.status(500);
    throw new Error('PayPal payment capture failed');
  }
});

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  getSellerOrders,
  createPayPalOrder,
  capturePayPalPayment,
};