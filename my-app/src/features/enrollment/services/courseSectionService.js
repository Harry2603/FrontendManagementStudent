import axiosClient from "@/services/axiosClient";

export const courseSectionService = {
  getOpenSections: ({
    courseName = "",
    sectionCode = "",
    pageNumber = 1,
    pageSize = 10,
  } = {}) =>
    axiosClient.get("/course-sections", {
      params: {
        Status: "OPEN",
        CourseName: courseName || undefined,
        SectionCode: sectionCode || undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
  getMySections: ({ pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/student/me/course-sections", {
      params: { PageNumber: pageNumber, PageSize: pageSize },
    }),
  getTeacherSections: ({
    courseName = "",
    sectionCode = "",
    pageNumber = 1,
    pageSize = 10,
  } = {}) =>
    axiosClient.get("/teachers/me/course-sections", {
      params: {
        CourseName: courseName || undefined,
        SectionCode: sectionCode || undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
  getTeacherSectionDetail: (sectionId) =>
    axiosClient.get(`/teachers/me/course-sections/${sectionId}`),
  getGradeComponents: (sectionId) =>
    axiosClient.get(`/gradeComponents/${sectionId}`),
  updateGradeComponents: (sectionId, payload) =>
    axiosClient.put(`/gradeComponents/${sectionId}`, payload),
  updateStudentScore: (studentScoreId, score) =>
    axiosClient.patch(`/teachers/studentScores/${studentScoreId}`, { score }),
  finalizeGrades: (sectionId) =>
    axiosClient.patch(`/teacher/courseSections/${sectionId}/grades/finalize`),
  postEnrolls: (payload) => axiosClient.post(`/enrollment/batch`, payload),
};
