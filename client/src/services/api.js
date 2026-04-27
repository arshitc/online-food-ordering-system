import axios from "axios";
import { API_BASE_URL } from "../utils/runtimeConfig";

const API = axios.create({
  baseURL: API_BASE_URL
});

const getStoredUser = () => {
  const rawUser = localStorage.getItem("food-app-user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem("food-app-user");
    return null;
  }
};

API.interceptors.request.use((config) => {
  const user = getStoredUser();

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    return Promise.reject({
      ...error,
      message
    });
  }
);

export const getApiErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

export default API;
