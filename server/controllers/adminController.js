const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { getDeliverySettings } = require("../utils/deliveryPricing");

const getDashboardStats = asyncHandler(async (req, res) => {
  const [users, restaurants, orders, payments, complaints] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Payment.countDocuments({ paymentStatus: "Success" }),
    Order.countDocuments({ "issueReport.isRaised": true, "issueReport.resolved": false })
  ]);

  const revenueData = await Payment.aggregate([
    { $match: { paymentStatus: "Success" } },
    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
  ]);

  res.json({
    users,
    restaurants,
    orders,
    successfulPayments: payments,
    openComplaints: complaints,
    totalRevenue: revenueData[0]?.totalRevenue || 0
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = req.body.isActive;
  const updated = await user.save();
  res.json(updated);
});

const getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find().populate("owner", "name email");
  res.json(restaurants);
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("customerId", "name")
    .populate("restaurantId", "name")
    .populate("deliveryStaffId", "name")
    .sort({ createdAt: -1 });
  res.json(orders);
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("orderId", "status")
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });
  res.json(payments);
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Order.find({ "issueReport.isRaised": true })
    .populate("customerId", "name email")
    .populate("restaurantId", "name");
  res.json(complaints);
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.issueReport.resolved = true;
  await order.save();
  res.json(order);
});

const getDeliverySettingsForAdmin = asyncHandler(async (req, res) => {
  const settings = await getDeliverySettings();
  res.json(settings);
});

const updateDeliverySettings = asyncHandler(async (req, res) => {
  const deliveryRatePerKm = Number(req.body.deliveryRatePerKm);
  const minimumDeliveryFee = Number(req.body.minimumDeliveryFee);
  const defaultDeliveryFee = Number(req.body.defaultDeliveryFee);

  if (!Number.isFinite(deliveryRatePerKm) || deliveryRatePerKm < 0) {
    res.status(400);
    throw new Error("Delivery rate per kilometer must be a valid number.");
  }

  if (!Number.isFinite(minimumDeliveryFee) || minimumDeliveryFee < 0) {
    res.status(400);
    throw new Error("Minimum delivery fee must be a valid number.");
  }

  if (!Number.isFinite(defaultDeliveryFee) || defaultDeliveryFee < 0) {
    res.status(400);
    throw new Error("Fallback delivery fee must be a valid number.");
  }

  const settings = await getDeliverySettings();
  settings.deliveryRatePerKm = deliveryRatePerKm;
  settings.minimumDeliveryFee = minimumDeliveryFee;
  settings.defaultDeliveryFee = defaultDeliveryFee;

  const updated = await settings.save();
  res.json(updated);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  if (user.role === "admin") {
    // If we want to safeguard deleting the LAST admin, we could.
    // For now, simple strict deletion applies.
  }

  if (user.role === "owner") {
    const orphanRestIds = await Restaurant.find({ owner: user._id }).distinct('_id');
    if (orphanRestIds.length > 0) {
      // Cascade delete the menu items attached to their restaurants
      await require("../models/MenuItem").deleteMany({ restaurantId: { $in: orphanRestIds } });
      // Cascade delete the restaurants
      await Restaurant.deleteMany({ owner: user._id });
    }
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User permanently deleted", _id: req.params.id });
});

const generateToken = require("../utils/generateToken");
const impersonateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Impersonation target not found");
  }

  // Admin cannot impersonate another admin (security loop bypass)
  if (user.role === "admin" && user._id.toString() !== req.user._id.toString()) {
     res.status(403);
     throw new Error("You cannot impersonate a fellow admin.");
  }

  // Return a freshly minted valid token acting as this user
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    addresses: user.addresses,
    isActive: user.isActive,
    token: generateToken(user._id, user.role)
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  impersonateUser,
  getRestaurants,
  getOrders,
  getPayments,
  getComplaints,
  resolveComplaint,
  getDeliverySettingsForAdmin,
  updateDeliverySettings
};
