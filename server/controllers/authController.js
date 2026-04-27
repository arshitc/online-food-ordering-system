const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
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

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 2) {
      res.status(403);
      throw new Error("System is strictly limited to 2 Admin accounts maximum.");
    }
  }

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: role || "customer"
  });

  res.status(201).json(sanitizeUser(user));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json(sanitizeUser(user));
});

const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.avatar = req.body.avatar || user.avatar;
  user.addresses = req.body.addresses || user.addresses;

  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, 10);
  }

  const updated = await user.save();
  res.json(sanitizeUser(updated));
});

const listDeliveryStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: "delivery", isActive: true }).select("-password");
  res.json(staff);
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listDeliveryStaff
};

