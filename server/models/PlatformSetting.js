const mongoose = require("mongoose");

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "platform", unique: true },
    deliveryRatePerKm: { type: Number, default: 8 },
    minimumDeliveryFee: { type: Number, default: 20 },
    defaultDeliveryFee: { type: Number, default: 40 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformSetting", platformSettingSchema);
