import axiosClient from "@/services/axiosClient";

export const courseSectionService = {
  getOpenSections: () =>
    axiosClient.get("/course-sections", { params: { Status: "OPEN" } }),
  postEnrolls: (payload) => axiosClient.post(`/enrollment/batch`, payload),
};
