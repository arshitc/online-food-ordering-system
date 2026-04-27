import API from "./api";

const register = async (payload) => {
  const { data } = await API.post("/auth/register", payload);
  return data;
};

const login = async (payload) => {
  const { data } = await API.post("/auth/login", payload);
  return data;
};

const getProfile = async () => {
  const { data } = await API.get("/auth/profile");
  return data;
};

const updateProfile = async (payload) => {
  const { data } = await API.put("/auth/profile", payload);
  return data;
};

const getDeliveryStaff = async () => {
  const { data } = await API.get("/auth/delivery-staff");
  return data;
};

const impersonate = async (id) => {
  const { data } = await API.post(`/admin/users/${id}/impersonate`);
  return data;
};

const authService = { register, login, getProfile, updateProfile, getDeliveryStaff, impersonate };
export default authService;

