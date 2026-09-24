import axiosClient from "@/services/axiosClient";

export const courseManagementService = {
  getCourses: ({ pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/courses", { params: { PageNumber: pageNumber, PageSize: pageSize } }),
  getCourseById: (id) => axiosClient.get(`/courses/${id}`),
  getCourseSections: ({ courseId, pageNumber = 1, pageSize = 100 }) =>
    axiosClient.get("/course-sections", {
      params: { CourseId: courseId, PageNumber: pageNumber, PageSize: pageSize },
    }),
  getTeachers: ({ name = "", email = "", pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/admin/users", {
      params: {
        Role: "TEACHER",
        Name: name || undefined,
        Email: email || undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
  getSemesters: () => axiosClient.get("/semesters"),
  createCourse: (payload) => axiosClient.post("/courses", payload),
  createCourseSection: (payload) => axiosClient.post("/course-sections", payload),
};
