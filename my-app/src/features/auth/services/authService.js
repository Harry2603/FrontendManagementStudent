import axiosClient from "@/services/axiosClient";

export const authService = {
  login: (payload) => axiosClient.post("/auth/login", payload),
  adminLogin: (payload) => axiosClient.post("/auth/admin/login", payload),
  register: (payload) => axiosClient.post("/auth/register", payload),
  getMe: () => axiosClient.get("/users/me"),
  updateProfile: (payload) => axiosClient.put("/users/profile", payload),
};