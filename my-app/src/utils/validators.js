const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9,11}$/;

export const validateRequired = (value, label) =>
  value.trim() ? "" : "Please enter " + label + ".";

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return "Please confirm your password.";
  if (confirm !== password) return "Passwords do not match.";
  return "";
};

export const validateDateOfBirth = (value) => {
  if (!value) return "Please select your date of birth.";
  // 'en-CA' cho định dạng YYYY-MM-DD theo giờ máy, cùng định dạng với <input type="date">
  const today = new Date().toLocaleDateString("en-CA");
  if (value > today) return "Date of birth cannot be in the future.";
  return "";
};

export const validatePhone = (value) => {
  const phone = value.trim();
  if (!phone) return "Please enter a phone number.";
  if (!PHONE_REGEX.test(phone)) return "Phone number must contain 9 to 11 digits.";
  return "";
};

export const validateGender = (value) =>
  value ? "" : "Please select a gender.";

export const validateEmail = (value) => {
  const email = value.trim();
  if (!email) return "Please enter an email address.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  return "";
};

export const validatePassword = (value) => {
  if (!value) return "Please enter a password.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  return "";
};
