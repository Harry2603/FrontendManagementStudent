export const getCreateTeacherError = (error) => {
  if (!error.response) {
    return { form: "Không kết nối được máy chủ, vui lòng thử lại" };
  }
  if (error.response.status === 409) {
    return { email: "Email đã được sử dụng" };
  }
  return { form: "Tạo tài khoản giảng viên thất bại, vui lòng thử lại" };
};
