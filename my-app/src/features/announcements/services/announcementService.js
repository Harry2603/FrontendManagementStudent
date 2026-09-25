import axiosClient from "@/services/axiosClient";

export const announcementService = {
  getAll: ({ title = "", pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/announcements", {
      params: { title: title || undefined, pageNumber, pageSize },
    }),
  create: (payload) => axiosClient.post("/announcements", payload),
};
