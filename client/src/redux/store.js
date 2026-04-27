import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from "./cartSlice";
import restaurantReducer from "./restaurantSlice";
import orderReducer from "./orderSlice";
import reviewReducer from "./reviewSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    restaurants: restaurantReducer,
    orders: orderReducer,
    reviews: reviewReducer
  }
});

export default store;

