const asyncHandler = require("express-async-handler");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Review = require("../models/Review");

const toNumberOrUndefined = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const buildRestaurantPayload = (body) => {
  const payload = { ...body };
  const latitude = toNumberOrUndefined(body.latitude ?? body.locationLatitude);
  const longitude = toNumberOrUndefined(body.longitude ?? body.locationLongitude);
  const accuracyMeters = toNumberOrUndefined(body.accuracyMeters ?? body.locationAccuracyMeters);

  delete payload.latitude;
  delete payload.longitude;
  delete payload.accuracyMeters;
  delete payload.locationLatitude;
  delete payload.locationLongitude;
  delete payload.locationAccuracyMeters;
  delete payload.deliveryFee;

  if (latitude !== undefined && longitude !== undefined) {
    payload.locationCoordinates = {
      latitude,
      longitude,
      ...(accuracyMeters !== undefined ? { accuracyMeters } : {}),
      updatedAt: new Date()
    };
  }

  return payload;
};

const getRestaurants = asyncHandler(async (req, res) => {
  const { search = "", city = "", cuisine = "" } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (city) {
    query.city = { $regex: city, $options: "i" };
  }

  if (cuisine) {
    query.cuisine = { $in: [new RegExp(cuisine, "i")] };
  }

  const restaurants = await Restaurant.find(query).populate("owner", "name email");
  res.json(restaurants);
});

const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate("owner", "name email");
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  const menu = await MenuItem.find({ restaurantId: restaurant._id });
  const reviews = await Review.find({ restaurantId: restaurant._id })
    .populate("customerId", "name")
    .sort({ createdAt: -1 });

  res.json({ restaurant, menu, reviews });
});

const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create({
    ...buildRestaurantPayload(req.body),
    owner: req.user._id,
    image: req.file ? `/${req.file.path}` : req.body.image || ""
  });

  res.status(201).json(restaurant);
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  if (
    req.user.role !== "admin" &&
    restaurant.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("You can only update your own restaurant");
  }

  Object.assign(restaurant, buildRestaurantPayload(req.body));
  if (req.file) {
    restaurant.image = `/${req.file.path}`;
  }

  const updated = await restaurant.save();
  res.json(updated);
});

const getOwnerRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id });
  res.json(restaurants);
});

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getOwnerRestaurants
};
