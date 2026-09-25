import axiosClient from "@/services/axiosClient";
export const userService = {
  createTeacher: (payload) => axiosClient.post("/teachers", payload),
  getAllUsers: ({ search = "", role, pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/admin/users", {
      params: {
        Name: search,
        Email: search,
        Role: role,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
};
