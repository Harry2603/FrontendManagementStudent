import axiosClient from "@/services/axiosClient";

export const announcementService = {
  getAll: ({ pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/announcements", { params: { pageNumber, pageSize } }),
  create: (payload) => axiosClient.post("/announcements", payload),
};
