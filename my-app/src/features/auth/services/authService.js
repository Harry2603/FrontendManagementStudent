import axiosClient from "@/services/axiosClient";

export const authService = {
  login: (payload) => axiosClient.post("/auth/login", payload),
  faceLogin: (frames) => {
    const formData = new FormData();
    frames.forEach((frame, index) => {
      formData.append("request", frame, "face-login-" + (index + 1) + ".jpg");
    });

    return axiosClient.post("/auth/face-login", formData, { timeout: 60000 });
  },
  adminLogin: (payload) => axiosClient.post("/auth/admin/login", payload),
  register: (payload) => axiosClient.post("/auth/register", payload),
  getMe: () => axiosClient.get("/users/me"),
  updateProfile: (payload) => axiosClient.put("/users/profile", payload),
};
