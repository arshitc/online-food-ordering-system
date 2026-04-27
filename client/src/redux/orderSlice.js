import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import orderService from "../services/orderService";

export const placeOrder = createAsyncThunk("orders/create", orderService.createOrder);
export const fetchMyOrders = createAsyncThunk("orders/my", orderService.getMyOrders);
export const fetchOrderById = createAsyncThunk("orders/byId", orderService.getOrderById);
export const fetchRestaurantOrders = createAsyncThunk("orders/restaurant", orderService.getRestaurantOrders);
export const updateOwnerOrderStatus = createAsyncThunk(
  "orders/restaurantUpdate",
  ({ id, payload }) => orderService.updateRestaurantOrderStatus(id, payload)
);
export const fetchAssignedOrders = createAsyncThunk("orders/deliveryAssigned", orderService.getAssignedOrders);
export const updateDriverStatus = createAsyncThunk(
  "orders/deliveryUpdate",
  ({ id, payload }) => orderService.updateDeliveryStatus(id, payload)
);
export const resolveOwnerOrderIssue = createAsyncThunk(
  "orders/restaurantIssueResolve",
  ({ id, payload }) => orderService.resolveRestaurantOrderIssue(id, payload)
);
export const sendOrderChat = createAsyncThunk(
  "orders/sendChat",
  ({ id, payload }) => orderService.sendOrderChatMessage(id, payload)
);
export const deleteCustomerOrder = createAsyncThunk(
  "orders/delete",
  (id) => orderService.deleteOrder(id)
);

const initialState = {
  list: [],
  selected: null,
  loading: false
};

const setOrderList = (state, action) => {
  state.loading = false;
  state.list = action.payload;
};

const setSelectedOrder = (state, action) => {
  state.loading = false;
  state.selected = action.payload;
};

const replaceOrderInState = (state, action) => {
  state.loading = false;
  state.selected = action.payload;
  state.list = state.list.map((order) =>
    order._id === action.payload._id ? action.payload : order
  );
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    pushRealtimeOrderUpdate(state, action) {
      const updatedOrder = action.payload;
      state.selected =
        state.selected && state.selected._id === updatedOrder._id
          ? updatedOrder
          : state.selected;
      state.list = state.list.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      );
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.fulfilled, setOrderList)
      .addCase(fetchRestaurantOrders.fulfilled, setOrderList)
      .addCase(fetchAssignedOrders.fulfilled, setOrderList)
      .addCase(fetchOrderById.fulfilled, setSelectedOrder)
      .addCase(placeOrder.fulfilled, (state, action) => {
        const createdOrders = Array.isArray(action.payload?.orders)
          ? action.payload.orders
          : [action.payload];

        state.loading = false;
        state.list = [...createdOrders, ...state.list];
        state.selected = createdOrders[0] || null;
      })
      .addCase(updateOwnerOrderStatus.fulfilled, replaceOrderInState)
      .addCase(updateDriverStatus.fulfilled, replaceOrderInState)
      .addCase(resolveOwnerOrderIssue.fulfilled, replaceOrderInState)
      .addCase(sendOrderChat.fulfilled, replaceOrderInState)
      .addCase(deleteCustomerOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(order => order._id !== action.payload._id);
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("orders/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("orders/") && action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  }
});

export const { pushRealtimeOrderUpdate } = orderSlice.actions;
export default orderSlice.reducer;
