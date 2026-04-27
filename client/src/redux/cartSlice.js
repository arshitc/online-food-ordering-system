import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import orderService from "../services/orderService";

export const loadCart = createAsyncThunk("cart/load", orderService.getCart);
export const addCartItem = createAsyncThunk("cart/add", orderService.addToCart);
export const changeCartItem = createAsyncThunk(
  "cart/update",
  ({ itemId, payload }) => orderService.updateCartItem(itemId, payload)
);
export const deleteCartItem = createAsyncThunk("cart/remove", orderService.removeCartItem);
export const clearCartItems = createAsyncThunk("cart/clear", orderService.clearCart);

const initialState = {
  items: [],
  loading: false
};

const setCartFromResponse = (state, action) => {
  state.loading = false;
  state.items = action.payload.items || [];
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.fulfilled, setCartFromResponse)
      .addCase(addCartItem.fulfilled, setCartFromResponse)
      .addCase(changeCartItem.fulfilled, setCartFromResponse)
      .addCase(deleteCartItem.fulfilled, setCartFromResponse)
      .addCase(clearCartItems.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addMatcher(
        (action) =>
          ["cart/load/pending", "cart/add/pending", "cart/update/pending", "cart/remove/pending", "cart/clear/pending"].includes(
            action.type
          ),
        (state) => {
          state.loading = true;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("cart/") && action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  }
});

export default cartSlice.reducer;
