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
  requestPasswordResetOtp: (payload) =>
    axiosClient.post("/auth/password-reset/otp/request", payload),
  verifyPasswordResetOtp: (payload) =>
    axiosClient.post("/auth/password-reset/otp/verify", payload),
  verifyPasswordResetFace: (frames) => {
    const formData = new FormData();
    frames.forEach((frame, index) => {
      const filename = frame.name || `face-reset-${index + 1}.jpg`;
      formData.append("frames", frame, filename);
    });

    return axiosClient.post("/auth/password-reset/face/verify", formData, {
      timeout: 60000,
    });
  },
  confirmPasswordReset: (payload) =>
    axiosClient.post("/auth/password-reset/confirm", payload),
  getMe: () => axiosClient.get("/users/me"),
  updateProfile: (payload) => axiosClient.put("/users/profile", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/users/me/avatar", formData);
  },
};
