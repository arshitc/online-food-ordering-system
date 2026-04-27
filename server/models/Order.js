const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deliveryAssignmentStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending"
    },
    items: [orderItemSchema],
    deliveryAddress: {
      line1: { type: String, required: true },
      line2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      landmark: { type: String, default: "" },
      latitude: { type: Number },
      longitude: { type: Number }
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      deliveryDistanceKm: { type: Number },
      deliveryRatePerKm: { type: Number },
      deliveryFeeSource: { type: String, enum: ["distance", "fallback"], default: "fallback" },
      tax: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "ONLINE"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
      ],
      default: "Pending"
    },
    timeline: [timelineSchema],
    specialInstructions: { type: String, default: "" },
    estimatedDeliveryAt: { type: Date },
    deliveryTracking: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracyMeters: { type: Number },
      speedKmph: { type: Number },
      speedSource: {
        type: String,
        enum: ["device", "calculated", "estimated"],
        default: "estimated"
      },
      distanceToCustomerKm: { type: Number },
      estimatedArrivalMinutes: { type: Number },
      updatedAt: { type: Date }
    },
    issueReport: {
      isRaised: { type: Boolean, default: false },
      message: { type: String, default: "" },
      resolved: { type: Boolean, default: false },
      chatMessages: [
        {
          senderRole: { type: String, enum: ["Customer", "Restaurant"] },
          message: { type: String, required: true },
          timestamp: { type: Date, default: Date.now }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
