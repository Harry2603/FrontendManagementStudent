import axiosClient from "@/services/axiosClient";

export const courseSectionService = {
  getOpenSections: () =>
    axiosClient.get("/course-sections", { params: { Status: "OPEN" } }),
  getMySections: () => axiosClient.get("/student/me/course-sections"),
  getTeacherSections: () => axiosClient.get("/teachers/me/course-sections"),
  getTeacherSectionDetail: (sectionId) =>
    axiosClient.get(`/teachers/me/course-sections/${sectionId}`),
  updateStudentScore: (studentScoreId, score) =>
    axiosClient.patch(`/teachers/studentScores/${studentScoreId}`, { score }),
  postEnrolls: (payload) => axiosClient.post(`/enrollment/batch`, payload),
};
