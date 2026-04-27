const asyncHandler = require("express-async-handler");
const Stripe = require("stripe");
const Payment = require("../models/Payment");
const Order = require("../models/Order");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!stripe) {
    return res.json({
      clientSecret: "mock_client_secret",
      mode: "mock",
      message: "Stripe key not configured, using mock payment mode"
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100),
    currency: "inr",
    automatic_payment_methods: { enabled: true }
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    mode: "stripe"
  });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId, transactionId = `MOCK-${Date.now()}` } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.paymentStatus = "paid";
  order.timeline.push({
    status: order.status,
    note: "Online payment successful. Waiting for restaurant to accept your order.",
    updatedBy: order.customerId
  });
  await order.save();

  await Payment.findOneAndUpdate(
    { orderId },
    {
      paymentStatus: "Success",
      transactionId
    }
  );

  res.json({ message: "Payment confirmed", order });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customerId: req.user._id }).sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getMyPayments
};
