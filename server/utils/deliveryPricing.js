const PlatformSetting = require("../models/PlatformSetting");

const EARTH_RADIUS_KM = 6371;

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
  const startLatitude = toFiniteNumber(start?.latitude);
  const startLongitude = toFiniteNumber(start?.longitude);
  const endLatitude = toFiniteNumber(end?.latitude);
  const endLongitude = toFiniteNumber(end?.longitude);

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

const getDeliverySettings = async () =>
  PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    {
      $setOnInsert: {
        deliveryRatePerKm: 8,
        minimumDeliveryFee: 20,
        defaultDeliveryFee: 40
      }
    },
    { new: true, upsert: true }
  );

const calculateDeliveryCharge = ({ restaurant, deliveryAddress, settings }) => {
  const restaurantCoordinates = restaurant?.locationCoordinates || {};
  const distanceKm = calculateDistanceKm(restaurantCoordinates, deliveryAddress);
  const deliveryRatePerKm = Number(settings?.deliveryRatePerKm || 0);
  const minimumDeliveryFee = Number(settings?.minimumDeliveryFee || 0);
  const fallbackDeliveryFee = Number(
    settings?.defaultDeliveryFee ?? restaurant?.deliveryFee ?? 40
  );

  if (distanceKm !== null && deliveryRatePerKm > 0) {
    const distanceBasedFee = roundTo(distanceKm * deliveryRatePerKm, 2);

    return {
      deliveryFee: Math.max(minimumDeliveryFee, distanceBasedFee),
      deliveryDistanceKm: roundTo(distanceKm, 2),
      deliveryRatePerKm,
      deliveryFeeSource: "distance"
    };
  }

  return {
    deliveryFee: fallbackDeliveryFee,
    deliveryDistanceKm: undefined,
    deliveryRatePerKm,
    deliveryFeeSource: "fallback"
  };
};

module.exports = {
  calculateDeliveryCharge,
  calculateDistanceKm,
  getDeliverySettings,
  roundTo,
  toFiniteNumber
};
