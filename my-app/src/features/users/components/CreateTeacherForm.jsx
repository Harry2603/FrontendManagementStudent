import { memo, useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  validateDateOfBirth,
  validateEmail,
  validateGender,
  validatePassword,
  validatePhone,
  validateRequired,
} from "@/utils/validators";
import { userService } from "../services/useService";
import { getCreateTeacherError } from "../utils/userErrors";

const DEFAULT_AVATAR_URL =
  "https://tse4.mm.bing.net/th/id/OIP.jixXH_Els1MXBRmKFdMQPAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3";

const INITIAL_VALUES = {
  email: "",
  password: "",
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  avatarUrl: DEFAULT_AVATAR_URL,
};

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const INPUT_CLASS =
  "w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600";

// Đặt ở module scope + memo: giống RegisterForm, gõ vào 1 ô thì chỉ ô đó render lại
const Field = memo(function Field({
  name,
  label,
  type = "text",
  value,
  error,
  onChange,
  autoComplete,
  options,
  max,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          className={INPUT_CLASS}
        >
          <option value="">-- Chọn --</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={name}
            name={name}
            type={type === "password" && showPassword ? "text" : type}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            max={max}
            aria-invalid={!!error}
            className={`${INPUT_CLASS}${type === "password" ? " pr-10" : ""}`}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default function CreateTeacherForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage("");
    // Nếu errors không đổi thì React bỏ qua render (giống RegisterForm)
    setErrors((prev) =>
      prev[name] || prev.form ? { ...prev, [name]: "", form: "" } : prev,
    );
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const clientErrors = {
        email: validateEmail(values.email),
        password: validatePassword(values.password),
        fullName: validateRequired(values.fullName, "họ tên"),
        dateOfBirth: validateDateOfBirth(values.dateOfBirth),
        gender: validateGender(values.gender),
        phone: validatePhone(values.phone),
        address: validateRequired(values.address, "địa chỉ"),
      };
      if (Object.values(clientErrors).some(Boolean)) {
        setErrors(clientErrors);
        return;
      }

      setLoading(true);
      try {
        await userService.createTeacher({
          email: values.email.trim(),
          password: values.password,
          fullName: values.fullName.trim(),
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          phone: values.phone.trim(),
          address: values.address.trim(),
          avatarUrl: values.avatarUrl.trim() || DEFAULT_AVATAR_URL,
        });
        setValues(INITIAL_VALUES);
        setSuccessMessage("Tạo tài khoản giảng viên thành công");
      } catch (error) {
        setErrors(getCreateTeacherError(error));
      } finally {
        setLoading(false);
      }
    },
    [values],
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow"
    >
      <h1 className="text-2xl font-semibold text-gray-900">
        Tạo tài khoản giảng viên
      </h1>

      {successMessage && (
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {errors.form && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <Field
        name="fullName"
        label="Họ và tên"
        autoComplete="name"
        value={values.fullName}
        error={errors.fullName}
        onChange={handleChange}
      />

      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          name="dateOfBirth"
          label="Ngày sinh"
          type="date"
          max={new Date().toLocaleDateString("en-CA")}
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          onChange={handleChange}
        />
        <Field
          name="gender"
          label="Giới tính"
          options={GENDER_OPTIONS}
          value={values.gender}
          error={errors.gender}
          onChange={handleChange}
        />
      </div>

      <Field
        name="phone"
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        error={errors.phone}
        onChange={handleChange}
      />

      <Field
        name="address"
        label="Địa chỉ"
        autoComplete="street-address"
        value={values.address}
        error={errors.address}
        onChange={handleChange}
      />

      <Field
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        value={values.password}
        error={errors.password}
        onChange={handleChange}
      />

      <Field
        name="avatarUrl"
        label="Link ảnh đại diện"
        autoComplete="off"
        value={values.avatarUrl}
        error={errors.avatarUrl}
        onChange={handleChange}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
