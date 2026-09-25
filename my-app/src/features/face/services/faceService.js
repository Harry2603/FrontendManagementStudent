import axiosClient from "@/services/axiosClient";

const registrationPath = (sessionId, action) =>
  "/student/face/register/" + encodeURIComponent(sessionId) + action;

export const faceService = {
  getStatus: () => axiosClient.get("/student/face/status"),
  startRegistration: (password) =>
    axiosClient.post(
      "/student/face/register/start",
      { password },
      { skipUnauthorizedHandler: true },
    ),
  uploadFrame: (sessionId, frame) => {
    const formData = new FormData();
    formData.append("frame", frame, "face-registration.jpg");

    return axiosClient.post(registrationPath(sessionId, "/frames"), formData, {
      timeout: 60000,
    });
  },
  confirmRegistration: (sessionId) =>
    axiosClient.post(registrationPath(sessionId, "/confirm"), null, {
      timeout: 60000,
    }),
  cancelRegistration: (sessionId) =>
    axiosClient.delete(registrationPath(sessionId, "")),
  deleteFace: (password) =>
    axiosClient.delete("/student/face", {
      data: { password },
      skipUnauthorizedHandler: true,
    }),
};
