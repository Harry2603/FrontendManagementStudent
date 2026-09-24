import axiosClient from "@/services/axiosClient";

export const dashboardService = {
  getStudentCount: () =>
    axiosClient.get("/admin/users", {
      params: { Role: "STUDENT", PageNumber: 1, PageSize: 1 },
    }),
  getTeacherCount: () =>
    axiosClient.get("/admin/users", {
      params: { Role: "TEACHER", PageNumber: 1, PageSize: 1 },
    }),
  getCourseCount: () =>
    axiosClient.get("/courses", { params: { PageNumber: 1, PageSize: 1 } }),
  getCourseSectionCount: () =>
    axiosClient.get("/course-sections", {
      params: { PageNumber: 1, PageSize: 1 },
    }),
  getSemesters: () => axiosClient.get("/semesters"),
};
