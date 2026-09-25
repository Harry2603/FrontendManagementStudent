import axiosClient from "@/services/axiosClient";

export const transcriptService = {
  getCourseResults: ({ pageNumber = 1, pageSize = 100 } = {}) =>
    axiosClient.get("/student/me/course-results", {
      params: { pageNumber, pageSize },
    }),
  getGpa: () => axiosClient.get("/student/me/gpa"),
};
