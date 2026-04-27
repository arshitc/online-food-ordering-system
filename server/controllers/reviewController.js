const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const recalculateRestaurantRating = async (restaurantId) => {
  const reviews = await Review.find({ restaurantId });
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const rating = reviews.length ? total / reviews.length : 0;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: Number(rating.toFixed(1)),
    totalReviews: reviews.length
  });
};

const createReview = asyncHandler(async (req, res) => {
  const { orderId, restaurantId, rating, comment } = req.body;
  const order = await Order.findById(orderId);

  if (!order || order.customerId.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error("Invalid order selected for review");
  }

  if (order.status !== "Delivered") {
    res.status(400);
    throw new Error("Review can be added only after delivery");
  }

  const existing = await Review.findOne({ orderId, customerId: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error("You have already reviewed this order");
  }

  const review = await Review.create({
    orderId,
    restaurantId,
    customerId: req.user._id,
    rating,
    comment
  });

  await recalculateRestaurantRating(restaurantId);
  res.status(201).json(review);
});

const getRestaurantReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ restaurantId: req.params.restaurantId })
    .populate("customerId", "name")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

module.exports = {
  createReview,
  getRestaurantReviews
};

