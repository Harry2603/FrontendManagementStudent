import axiosClient from "@/services/axiosClient";

export const courseManagementService = {
  getCourses: ({ search = "", pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/courses", {
      params: {
        CourseCode: search || undefined,
        CourseName: search || undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
  getCourseById: (courseId) => axiosClient.get(`/courses/${courseId}`),
  getCourseSections: ({ courseId, sectionCode = "", pageNumber = 1, pageSize = 100 }) =>
    axiosClient.get("/course-sections", {
      params: {
        CourseId: courseId,
        SectionCode: sectionCode || undefined,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
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
