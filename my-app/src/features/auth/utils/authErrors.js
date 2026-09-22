export const getLoginError = (error) => {
  if (!error.response) {
    return { form: "Không kết nối được máy chủ, vui lòng thử lại" };
  }
  if (error.response.status === 401) {
    return { form: "Sai email hoặc mật khẩu" };
  }
  return { form: "Đăng nhập thất bại, vui lòng thử lại" };
};

export const getRegisterError = (error) => {
  if (!error.response) {
    return { form: "Không kết nối được máy chủ, vui lòng thử lại" };
  }
  if (error.response.status === 409) {
    return { email: "Email đã được sử dụng" };
  }
  return { form: "Đăng ký thất bại, vui lòng thử lại" };
};
