import axiosClient from "@/services/axiosClient";
export const userService = {
  createTeacher: (payload) => axiosClient.post("/teachers", payload),
  getAllUsers: ({ name = "", email = "", role, pageNumber = 1, pageSize = 10 } = {}) =>
    axiosClient.get("/admin/users", {
      params: {
        Name: name || undefined,
        Email: email || undefined,
        Role: role,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }),
};
