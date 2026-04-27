import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "../services/authService";
import { getApiErrorMessage } from "../services/api";

const getStoredUser = () => {
  const rawValue = localStorage.getItem("food-app-user");

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem("food-app-user");
    return null;
  }
};

const storedUser = getStoredUser();

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getProfile();
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const saveProfile = createAsyncThunk(
  "auth/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.updateProfile(payload);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const impersonateUser = createAsyncThunk(
  "auth/impersonate",
  async (userId, { rejectWithValue }) => {
    try {
      return await authService.impersonate(userId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser,
    loading: false,
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem("food-app-user");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(impersonateUser.pending, (state) => {
        state.loading = true;
      })
      .addMatcher(
        (action) =>
          ["auth/register/fulfilled", "auth/login/fulfilled", "auth/profile/fulfilled", "auth/update/fulfilled", "auth/impersonate/fulfilled"].includes(
            action.type
          ),
        (state, action) => {
          const token = action.payload.token || state.user?.token || storedUser?.token;
          state.loading = false;
          state.user = {
            ...action.payload,
            ...(token ? { token } : {})
          };
          localStorage.setItem("food-app-user", JSON.stringify(state.user));
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
