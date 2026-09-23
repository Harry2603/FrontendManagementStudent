import axiosClient from "@/services/axiosClient";
export const userService = {
  createTeacher: (payload) => axiosClient.post("/teachers", payload),
};
