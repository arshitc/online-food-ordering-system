const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const calculateOrderTotal = require("../utils/calculateOrderTotal");
const {
  calculateDeliveryCharge,
  getDeliverySettings
} = require("../utils/deliveryPricing");
const appendOrderTimeline = require("../utils/orderStatusUpdater");
const sendEmail = require("../utils/sendEmail");

const EARTH_RADIUS_KM = 6371;
const DEFAULT_DELIVERY_SPEED_KMPH = 18;
const MIN_ETA_SPEED_KMPH = 8;
const MAX_REASONABLE_SPEED_KMPH = 120;

const populateOrderDetails = (orderQuery) =>
  orderQuery
    .populate("customerId", "name email phone")
    .populate("restaurantId", "name image location city locationCoordinates")
    .populate("deliveryStaffId", "name phone");

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const roundTo = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const calculateDistanceKm = (start, end) => {
  const startLatitude = toFiniteNumber(start.latitude);
  const startLongitude = toFiniteNumber(start.longitude);
  const endLatitude = toFiniteNumber(end.latitude);
  const endLongitude = toFiniteNumber(end.longitude);

  if (
    startLatitude === null ||
    startLongitude === null ||
    endLatitude === null ||
    endLongitude === null
  ) {
    return null;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(endLatitude - startLatitude);
  const dLng = toRadians(endLongitude - startLongitude);
  const lat1 = toRadians(startLatitude);
  const lat2 = toRadians(endLatitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const emitOrderUpdate = (req, order) => {
  if (req.io) {
    const customerRoomId = order.customerId?._id || order.customerId;
    const restaurantRoomId = order.restaurantId?._id || order.restaurantId;
    const deliveryRoomId = order.deliveryStaffId?._id || order.deliveryStaffId;

    req.io.to(`user:${customerRoomId}`).emit("order:update", order);
    req.io.to(`restaurant:${restaurantRoomId}`).emit("order:update", order);
    if (deliveryRoomId) {
      req.io.to(`delivery:${deliveryRoomId}`).emit("order:update", order);
    }
  }
};

const getDeliverySpeed = (order, deliveryLocation, now) => {
  const reportedSpeedKmph = toFiniteNumber(deliveryLocation.speedKmph);

  if (reportedSpeedKmph !== null && reportedSpeedKmph >= 0) {
    return {
      speedKmph: roundTo(Math.min(reportedSpeedKmph, MAX_REASONABLE_SPEED_KMPH), 1),
      speedSource: "device"
    };
  }

  const reportedSpeedMps = toFiniteNumber(
    deliveryLocation.speedMetersPerSecond ?? deliveryLocation.speedMps
  );

  if (reportedSpeedMps !== null && reportedSpeedMps >= 0) {
    return {
      speedKmph: roundTo(Math.min(reportedSpeedMps * 3.6, MAX_REASONABLE_SPEED_KMPH), 1),
      speedSource: "device"
    };
  }

  const previousTracking = order.deliveryTracking || {};
  const previousLatitude = toFiniteNumber(previousTracking.latitude);
  const previousLongitude = toFiniteNumber(previousTracking.longitude);
  const previousUpdatedAt = previousTracking.updatedAt
    ? new Date(previousTracking.updatedAt).getTime()
    : null;

  if (previousLatitude !== null && previousLongitude !== null && previousUpdatedAt) {
    const secondsElapsed = Math.max((now.getTime() - previousUpdatedAt) / 1000, 1);
    const distanceMovedKm = calculateDistanceKm(
      { latitude: previousLatitude, longitude: previousLongitude },
      deliveryLocation
    );
    const calculatedSpeedKmph = distanceMovedKm !== null
      ? (distanceMovedKm / (secondsElapsed / 3600))
      : null;

    if (
      calculatedSpeedKmph !== null &&
      calculatedSpeedKmph >= 0 &&
      calculatedSpeedKmph <= MAX_REASONABLE_SPEED_KMPH
    ) {
      return {
        speedKmph: roundTo(calculatedSpeedKmph, 1),
        speedSource: "calculated"
      };
    }
  }

  return {
    speedKmph: DEFAULT_DELIVERY_SPEED_KMPH,
    speedSource: "estimated"
  };
};

const applyDeliveryLocationUpdate = (order, deliveryLocation) => {
  if (!deliveryLocation) {
    return;
  }

  const latitude = toFiniteNumber(deliveryLocation.latitude);
  const longitude = toFiniteNumber(deliveryLocation.longitude);

  if (latitude === null || longitude === null) {
    return;
  }

  const now = new Date();
  const { speedKmph, speedSource } = getDeliverySpeed(
    order,
    { latitude, longitude, ...deliveryLocation },
    now
  );
  const distanceToCustomerKm = calculateDistanceKm(
    { latitude, longitude },
    {
      latitude: order.deliveryAddress?.latitude,
      longitude: order.deliveryAddress?.longitude
    }
  );
  let estimatedArrivalMinutes;

  if (
    distanceToCustomerKm !== null &&
    order.status === "Out for Delivery"
  ) {
    const etaSpeedKmph = Math.max(speedKmph, MIN_ETA_SPEED_KMPH);
    estimatedArrivalMinutes = Math.max(1, Math.ceil((distanceToCustomerKm / etaSpeedKmph) * 60));
    order.estimatedDeliveryAt = new Date(now.getTime() + estimatedArrivalMinutes * 60000);
  }

  if (order.status === "Delivered") {
    order.estimatedDeliveryAt = now;
  }

  order.deliveryTracking = {
    latitude,
    longitude,
    accuracyMeters: toFiniteNumber(deliveryLocation.accuracyMeters ?? deliveryLocation.accuracy),
    speedKmph,
    speedSource,
    distanceToCustomerKm: distanceToCustomerKm === null ? undefined : roundTo(distanceToCustomerKm, 2),
    estimatedArrivalMinutes,
    updatedAt: now
  };
};

const refreshOrderEtaForStatus = (order, status) => {
  if (status === "Out for Delivery") {
    order.estimatedDeliveryAt = new Date(Date.now() + 20 * 60000);
    return;
  }

  if (status === "Delivered") {
    order.estimatedDeliveryAt = new Date();
  }
};

const buildOrderQuote = async (customerId, deliveryAddress = {}) => {
  const cart = await Cart.findOne({ customerId });

  if (!cart || cart.items.length === 0) {
    return { cart, restaurantQuotes: [], settings: await getDeliverySettings() };
  }

  const groupedItems = cart.items.reduce((groups, item) => {
    const restaurantId = item.restaurantId.toString();

    if (!groups[restaurantId]) {
      groups[restaurantId] = [];
    }

    groups[restaurantId].push(item);
    return groups;
  }, {});

  const restaurantIds = Object.keys(groupedItems);
  const [restaurants, settings] = await Promise.all([
    Restaurant.find({ _id: { $in: restaurantIds } }),
    getDeliverySettings()
  ]);
  const restaurantMap = Object.fromEntries(
    restaurants.map((restaurant) => [restaurant._id.toString(), restaurant])
  );

  const restaurantQuotes = restaurantIds.map((restaurantId) => {
    const restaurant = restaurantMap[restaurantId];
    const items = groupedItems[restaurantId];
    const deliveryDetails = calculateDeliveryCharge({
      restaurant,
      deliveryAddress,
      settings
    });
    const pricing = calculateOrderTotal({
      items,
      ...deliveryDetails
    });

    return {
      restaurantId,
      restaurant,
      items,
      pricing
    };
  });

  return {
    cart,
    restaurantQuotes,
    settings
  };
};

const summarizeQuoteTotals = (restaurantQuotes) =>
  restaurantQuotes.reduce(
    (totals, quote) => ({
      subtotal: totals.subtotal + (quote.pricing.subtotal || 0),
      deliveryFee: totals.deliveryFee + (quote.pricing.deliveryFee || 0),
      tax: totals.tax + (quote.pricing.tax || 0),
      discount: totals.discount + (quote.pricing.discount || 0),
      totalAmount: totals.totalAmount + (quote.pricing.totalAmount || 0)
    }),
    { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, totalAmount: 0 }
  );

const formatOrderQuoteResponse = ({ restaurantQuotes, settings }) => ({
  deliveryRatePerKm: settings.deliveryRatePerKm,
  minimumDeliveryFee: settings.minimumDeliveryFee,
  defaultDeliveryFee: settings.defaultDeliveryFee,
  restaurants: restaurantQuotes.map(({ restaurantId, restaurant, pricing }) => ({
    restaurantId,
    restaurantName: restaurant?.name || "Restaurant",
    pricing
  })),
  totals: summarizeQuoteTotals(restaurantQuotes)
});

const getOrderQuote = asyncHandler(async (req, res) => {
  const { restaurantQuotes, settings } = await buildOrderQuote(
    req.user._id,
    req.body.deliveryAddress || {}
  );

  if (!restaurantQuotes.length) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  res.json(formatOrderQuoteResponse({ restaurantQuotes, settings }));
});

const createOrder = asyncHandler(async (req, res) => {
  const { deliveryAddress, paymentMethod = "ONLINE", specialInstructions = "" } = req.body;
  const { cart, restaurantQuotes } = await buildOrderQuote(req.user._id, deliveryAddress);

  if (!cart || restaurantQuotes.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }
  const initialStatus = paymentMethod === "COD" ? "Accepted" : "Pending";

  const orders = [];

  for (const { restaurantId, restaurant, items, pricing } of restaurantQuotes) {
    const order = await Order.create({
      customerId: req.user._id,
      restaurantId,
      items: items.map((item) => ({
        menuItemId: item.menuItem,
        name: item.itemName,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      deliveryAddress,
      pricing,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      status: initialStatus,
      specialInstructions,
      estimatedDeliveryAt: new Date(Date.now() + (restaurant?.averageDeliveryTime || 30) * 60000),
      timeline: [
        {
          status: "Pending",
          note: "Order placed successfully",
          updatedBy: req.user._id
        },
        ...(paymentMethod === "COD"
          ? [
              {
                status: "Accepted",
                note: "Restaurant received the order",
                updatedBy: req.user._id
              }
            ]
          : [])
      ]
    });

    await Payment.create({
      orderId: order._id,
      customerId: req.user._id,
      paymentMethod: paymentMethod === "COD" ? "COD" : "Online",
      gateway: paymentMethod === "COD" ? "manual" : "stripe",
      transactionId: `TXN-${Date.now()}-${restaurantId.slice(-4)}`,
      amount: pricing.totalAmount,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Success"
    });

    orders.push(order);
  }

  cart.items = [];
  await cart.save();

  await sendEmail({
    to: req.user.email,
    subject: "Order Confirmed",
    html: `<p>Your ${orders.length > 1 ? "orders have" : "order has"} been placed successfully.</p>`
  });

  orders.forEach((order) => emitOrderUpdate(req, order));

  if (orders.length === 1) {
    res.status(201).json(orders[0]);
    return;
  }

  res.status(201).json({
    orders,
    multipleOrders: true,
    pricing: {
      totalAmount: orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0)
    }
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await populateOrderDetails(Order.find({ customerId: req.user._id }))
    .sort({ createdAt: -1 });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await populateOrderDetails(Order.findById(req.params.id));

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json(order);
});

const getRestaurantOrders = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id }).select("_id");
  const restaurantIds = restaurants.map((restaurant) => restaurant._id);

  const orders = await Order.find({ restaurantId: { $in: restaurantIds } })
    .populate("customerId", "name phone")
    .populate("restaurantId", "name image location city locationCoordinates")
    .populate("deliveryStaffId", "name phone")
    .sort({ createdAt: -1 });

  res.json(orders);
});

const updateRestaurantOrderStatus = asyncHandler(async (req, res) => {
  const { status, deliveryStaffId, note } = req.body;
  const order = await Order.findById(req.params.id).populate("restaurantId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.restaurantId.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not allowed to update this order");
  }

  if (deliveryStaffId) {
    const staff = await User.findById(deliveryStaffId);
    if (staff && staff.role === "delivery") {
      if (order.deliveryStaffId?.toString() !== deliveryStaffId || order.deliveryAssignmentStatus === "Rejected") {
         order.deliveryAssignmentStatus = "Pending";
      }
      order.deliveryStaffId = deliveryStaffId;
    }
  }

  appendOrderTimeline(order, status, req.user._id, note || "Order updated by restaurant");
  refreshOrderEtaForStatus(order, status);
  await order.save();
  const populatedOrder = await populateOrderDetails(Order.findById(order._id));
  emitOrderUpdate(req, populatedOrder);
  res.json(populatedOrder);
});

const getAssignedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ deliveryStaffId: req.user._id })
    .populate("customerId", "name phone")
    .populate("restaurantId", "name image location contactNumber city locationCoordinates")
    .sort({ createdAt: -1 });
  res.json(orders);
});

const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, note, deliveryAssignmentStatus, deliveryLocation } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.deliveryStaffId?.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("This order is not assigned to you");
  }

  if (deliveryAssignmentStatus) {
    order.deliveryAssignmentStatus = deliveryAssignmentStatus;
    if (deliveryAssignmentStatus === "Rejected") {
      order.deliveryStaffId = null;
    }
  }

  if (status) {
    appendOrderTimeline(order, status, req.user._id, note || "Delivery update");
    refreshOrderEtaForStatus(order, status);
    if (status === "Delivered") {
      order.paymentStatus = "paid";
    }
  }

  applyDeliveryLocationUpdate(order, deliveryLocation);

  await order.save();
  const populatedOrder = await populateOrderDetails(Order.findById(order._id));
  emitOrderUpdate(req, populatedOrder);
  res.json(populatedOrder);
});

const raiseIssue = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only raise issues for your own order");
  }

  order.issueReport = {
    isRaised: true,
    message: req.body.message || "Issue raised by customer",
    resolved: false
  };

  await order.save();
  const populatedOrder = await populateOrderDetails(Order.findById(order._id));
  emitOrderUpdate(req, populatedOrder);
  res.json(populatedOrder);
});

const resolveIssueByRestaurant = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const order = await Order.findById(req.params.id).populate("restaurantId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.restaurantId.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not allowed to resolve this issue");
  }

  if (order.issueReport && order.issueReport.isRaised) {
    order.issueReport.resolved = true;
    appendOrderTimeline(
      order,
      order.status,
      req.user._id,
      note || "Issue marked as resolved by restaurant"
    );
    await order.save();
  }

  const populatedOrder = await populateOrderDetails(Order.findById(order._id));
  emitOrderUpdate(req, populatedOrder);
  res.json(populatedOrder);
});

const sendIssueChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const order = await Order.findById(req.params.id).populate("restaurantId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.issueReport || !order.issueReport.isRaised) {
    res.status(400);
    throw new Error("No active issue on this order");
  }

  let senderRole = "";
  if (order.customerId.toString() === req.user._id.toString()) {
    senderRole = "Customer";
  } else if (order.restaurantId.owner.toString() === req.user._id.toString() || req.user.role === "admin") {
    senderRole = "Restaurant";
  } else {
    res.status(403);
    throw new Error("Not authorized to chat on this issue");
  }

  if (!order.issueReport.chatMessages) {
    order.issueReport.chatMessages = [];
  }

  order.issueReport.chatMessages.push({
    senderRole,
    message
  });
  
  order.markModified("issueReport.chatMessages");

  await order.save();

  const populatedOrder = await populateOrderDetails(Order.findById(order._id));
  emitOrderUpdate(req, populatedOrder);
  res.json(populatedOrder);
});

const deleteOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.customerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized");
  }

  await Order.findByIdAndDelete(req.params.id);

  res.json({ message: "Order removed", _id: req.params.id });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderQuote,
  getRestaurantOrders,
  updateRestaurantOrderStatus,
  getAssignedOrders,
  updateDeliveryStatus,
  raiseIssue,
  resolveIssueByRestaurant,
  sendIssueChatMessage,
  deleteOrderById
};
