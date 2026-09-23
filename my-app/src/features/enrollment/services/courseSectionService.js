import axiosClient from "@/services/axiosClient";

export const courseSectionService = {
  getOpenSections: () =>
    axiosClient.get("/course-sections", { params: { Status: "OPEN" } }),
};