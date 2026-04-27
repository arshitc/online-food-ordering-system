import API from "./api";

const createReview = async (payload) => (await API.post("/reviews", payload)).data;
const getRestaurantReviews = async (restaurantId) => (await API.get(`/reviews/${restaurantId}`)).data;

const reviewService = { createReview, getRestaurantReviews };
export default reviewService;

