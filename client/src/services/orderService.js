import API from "./api";

const getCart = async () => (await API.get("/cart")).data;
const addToCart = async (payload) => (await API.post("/cart", payload)).data;
const updateCartItem = async (itemId, payload) => (await API.put(`/cart/${itemId}`, payload)).data;
const removeCartItem = async (itemId) => (await API.delete(`/cart/${itemId}`)).data;
const clearCart = async () => (await API.delete("/cart")).data;

const createOrder = async (payload) => (await API.post("/orders", payload)).data;
const quoteOrder = async (payload) => (await API.post("/orders/quote", payload)).data;
const getMyOrders = async () => (await API.get("/orders/my-orders")).data;
const getOrderById = async (id) => (await API.get(`/orders/${id}`)).data;
const getRestaurantOrders = async () => (await API.get("/orders/restaurant")).data;
const updateRestaurantOrderStatus = async (id, payload) =>
  (await API.put(`/orders/restaurant/${id}/status`, payload)).data;
const getAssignedOrders = async () => (await API.get("/orders/delivery/assigned")).data;
const updateDeliveryStatus = async (id, payload) =>
  (await API.put(`/orders/delivery/${id}/status`, payload)).data;
const raiseIssue = async (id, payload) => (await API.put(`/orders/${id}/issue`, payload)).data;
const resolveRestaurantOrderIssue = async (id, payload) => (await API.put(`/orders/restaurant/${id}/issue/resolve`, payload)).data;
const sendOrderChatMessage = async (id, payload) => (await API.post(`/orders/${id}/issue/chat`, payload)).data;
const deleteOrder = async (id) => (await API.delete(`/orders/${id}`)).data;

const orderService = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createOrder,
  quoteOrder,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateRestaurantOrderStatus,
  getAssignedOrders,
  updateDeliveryStatus,
  raiseIssue,
  resolveRestaurantOrderIssue,
  sendOrderChatMessage,
  deleteOrder
};

export default orderService;
