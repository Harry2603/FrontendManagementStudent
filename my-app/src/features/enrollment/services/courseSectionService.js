import axiosClient from "@/services/axiosClient";

export const courseSectionService = {
  getOpenSections: () =>
    axiosClient.get("/course-sections", { params: { Status: "OPEN" } }),
  getMySections: () => axiosClient.get("/student/me/course-sections"),
  postEnrolls: (payload) => axiosClient.post(`/enrollment/batch`, payload),
};
