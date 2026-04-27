import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import restaurantService from "../services/restaurantService";

export const fetchRestaurants = createAsyncThunk("restaurants/list", restaurantService.getRestaurants);
export const fetchRestaurantDetails = createAsyncThunk(
  "restaurants/details",
  restaurantService.getRestaurantDetails
);

const restaurantSlice = createSlice({
  name: "restaurants",
  initialState: {
    list: [],
    selected: null,
    loading: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type === "restaurants/details/pending" ||
          action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  }
});

export default restaurantSlice.reducer;

