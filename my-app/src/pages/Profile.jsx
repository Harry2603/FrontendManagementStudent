import { useCallback, useEffect, useState } from "react";
import { authService } from "../features/auth/services/authService";
import {
  validateDateOfBirth,
  validateGender,
  validatePhone,
  validateRequired,
} from "@/utils/validators";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export default function Profile() {
  const [profile, setProfile] = useState(null); // dữ liệu gốc: email, role, avatarUrl...
  const [values, setValues] = useState(null); // chỉ các field cho phép sửa
  const [errors, setErrors] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let ignore = false; // chặn setState nếu component unmount trước khi API trả về

    async function fetchProfile() {
      setPageLoading(true);
      setPageError("");
      try {
        const data = await authService.getMe();
        if (ignore) return;
        setProfile(data);
        setValues({
          fullName: data.fullName ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          gender: data.gender ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
        });
      } catch (error) {
        if (ignore) return;
        setPageError(
          error?.response?.data?.message ||
            "Không tải được thông tin, vui lòng thử lại",
        );
      } finally {
        if (!ignore) setPageLoading(false);
      }
    }

    fetchProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Chỉ tạo object errors mới khi thực sự có lỗi cần xóa -> tránh re-render thừa
    setErrors((prev) =>
      prev[name] || prev.form ? { ...prev, [name]: "", form: "" } : prev,
    );
    setSuccessMsg("");
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!values || !profile) return;

      const clientErrors = {
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

      setSaving(true);
      try {
        const updated = await authService.updateProfile({
          fullName: values.fullName.trim(),
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          phone: values.phone.trim(),
          address: values.address.trim(),
          avatarUrl: profile.avatarUrl, // field khóa, gửi lại nguyên giá trị default
        });
        setProfile(updated);
        setSuccessMsg("Cập nhật thông tin thành công");
      } catch (error) {
        setErrors({
          form:
            error?.response?.data?.message ||
            "Cập nhật thất bại, vui lòng thử lại",
        });
      } finally {
        setSaving(false);
      }
    },
    [values, profile],
  );

  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow">
        <p className="text-sm text-red-600">{pageError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow"
    >
      <h1 className="text-2xl font-semibold text-gray-900">
        Thông tin cá nhân
      </h1>

      {errors.form && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-600">
          {errors.form}
        </p>
      )}
      {successMsg && (
        <p
          role="status"
          className="rounded bg-green-50 p-3 text-sm text-green-700"
        >
          {successMsg}
        </p>
      )}

      {/* readonly: email dùng làm username nên khóa, role chỉ hiển thị tham khảo */}
      <Input name="email" label="Email" value={profile.email} disabled />
      <Input name="role" label="Vai trò" value={profile.role} disabled />

      <Input
        name="fullName"
        label="Họ và tên"
        autoComplete="name"
        value={values.fullName}
        error={errors.fullName}
        onChange={handleChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="dateOfBirth"
          label="Ngày sinh"
          type="date"
          max={new Date().toLocaleDateString("en-CA")}
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          onChange={handleChange}
        />
        <Select
          name="gender"
          label="Giới tính"
          options={GENDER_OPTIONS}
          value={values.gender}
          error={errors.gender}
          onChange={handleChange}
        />
      </div>

      <Input
        name="phone"
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        error={errors.phone}
        onChange={handleChange}
      />

      <Input
        name="address"
        label="Địa chỉ"
        autoComplete="street-address"
        value={values.address}
        error={errors.address}
        onChange={handleChange}
      />

      <Button type="submit" loading={saving}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
