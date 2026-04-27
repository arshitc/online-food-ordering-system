import API from "./api";

const getRestaurants = async (params) => {
  const { data } = await API.get("/restaurants", { params });
  return data;
};

const getRestaurantDetails = async (id) => {
  const { data } = await API.get(`/restaurants/${id}`);
  return data;
};

const createRestaurant = async (payload) => {
  const { data } = await API.post("/restaurants", payload);
  return data;
};

const updateRestaurant = async (id, payload) => {
  const { data } = await API.put(`/restaurants/${id}`, payload);
  return data;
};

const getOwnerRestaurants = async () => {
  const { data } = await API.get("/restaurants/owner/me");
  return data;
};

const getMenuItems = async (params) => {
  const { data } = await API.get("/menu", { params });
  return data;
};

const createMenuItem = async (payload) => {
  const { data } = await API.post("/menu", payload);
  return data;
};

const updateMenuItem = async (id, payload) => {
  const { data } = await API.put(`/menu/${id}`, payload);
  return data;
};

const deleteMenuItem = async (id) => {
  const { data } = await API.delete(`/menu/${id}`);
  return data;
};

const restaurantService = {
  getRestaurants,
  getRestaurantDetails,
  createRestaurant,
  updateRestaurant,
  getOwnerRestaurants,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

export default restaurantService;

