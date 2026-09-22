const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9,11}$/;

export const validateRequired = (value, label) =>
  value.trim() ? "" : `Vui lòng nhập ${label}`;

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return "Vui lòng nhập lại mật khẩu";
  if (confirm !== password) return "Mật khẩu nhập lại không khớp";
  return "";
};

export const validateDateOfBirth = (value) => {
  if (!value) return "Vui lòng chọn ngày sinh";
  // 'en-CA' cho định dạng YYYY-MM-DD theo giờ máy, cùng định dạng với <input type="date">
  const today = new Date().toLocaleDateString("en-CA");
  if (value > today) return "Ngày sinh không được ở tương lai";
  return "";
};

export const validatePhone = (value) => {
  const phone = value.trim();
  if (!phone) return "Vui lòng nhập số điện thoại";
  if (!PHONE_REGEX.test(phone)) return "Số điện thoại gồm 9 đến 11 chữ số";
  return "";
};

export const validateGender = (value) =>
  value ? "" : "Vui lòng chọn giới tính";

export const validateEmail = (value) => {
  const email = value.trim();
  if (!email) return "Vui lòng nhập email";
  if (!EMAIL_REGEX.test(email)) return "Email không đúng định dạng";
  return "";
};

export const validatePassword = (value) => {
  if (!value) return "Vui lòng nhập mật khẩu";
  if (value.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
  return "";
};
