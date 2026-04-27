const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    cuisine: [{ type: String }],
    location: { type: String, required: true },
    city: { type: String, required: true },
    locationCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracyMeters: { type: Number },
      updatedAt: { type: Date }
    },
    contactNumber: { type: String, required: true },
    image: { type: String, default: "" },
    deliveryFee: { type: Number, default: 40 },
    averageDeliveryTime: { type: Number, default: 30 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
