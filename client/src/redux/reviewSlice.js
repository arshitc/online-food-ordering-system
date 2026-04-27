import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import reviewService from "../services/reviewService";

export const loadReviews = createAsyncThunk("reviews/list", reviewService.getRestaurantReviews);
export const addReview = createAsyncThunk("reviews/create", reviewService.createReview);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    list: [],
    loading: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [action.payload, ...state.list];
      })
      .addMatcher(
        (action) => action.type.startsWith("reviews/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("reviews/") && action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  }
});

export default reviewSlice.reducer;
