import { useCallback, useEffect, useRef, useState } from "react";
import { authService } from "../features/auth/services/authService";
import { Camera, Pencil, Upload } from "lucide-react";
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
import { useAuth } from "@/features/auth";
import { getAvatarSrc, useDefaultAvatarOnError } from "@/utils/avatar";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export default function Profile() {
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null); // dữ liệu gốc: email, role, avatarUrl...
  const [values, setValues] = useState(null); // chỉ các field cho phép sửa
  const [errors, setErrors] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
            "Unable to load your profile. Please try again.",
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
        fullName: validateRequired(values.fullName, "your full name"),
        dateOfBirth: validateDateOfBirth(values.dateOfBirth),
        gender: validateGender(values.gender),
        phone: validatePhone(values.phone),
        address: validateRequired(values.address, "your address"),
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
        updateUser(updated);
        setIsEditing(false);
        setSuccessMsg("Profile updated successfully.");
      } catch (error) {
        setErrors({
          form:
            error?.response?.data?.message ||
            "Update failed. Please try again.",
        });
      } finally {
        setSaving(false);
      }
    },
    [values, profile, updateUser],
  );

  const handleAvatarUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setErrors({ form: "Please select an image file." });
        return;
      }

      setUploadingAvatar(true);
      setErrors((prev) => ({ ...prev, form: "" }));
      try {
        const { avatarUrl } = await authService.uploadAvatar(file);
        const updatedProfile = await authService.updateProfile({
          fullName: profile.fullName,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          phone: profile.phone,
          address: profile.address,
          avatarUrl,
        });
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        setSuccessMsg("Profile photo updated successfully.");
      } catch (error) {
        setErrors({
          form:
            error?.response?.data?.message ||
            "Unable to upload your profile photo. Please try again.",
        });
      } finally {
        setUploadingAvatar(false);
      }
    },
    [profile, updateUser],
  );

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      setValues({
        fullName: profile.fullName ?? "",
        dateOfBirth: profile.dateOfBirth ?? "",
        gender: profile.gender ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
      });
      setErrors({});
    }
    setIsEditing((editing) => !editing);
  }, [isEditing, profile]);

  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow">
        <p className="text-sm text-red-600">{pageError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-5xl space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10"
    >
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={getAvatarSrc(profile.avatarUrl)}
              alt="Profile"
              onError={useDefaultAvatarOnError}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-50"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Upload profile photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingAvatar ? <Upload size={14} className="animate-pulse" /> : <Camera size={15} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="sr-only"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">
              {profile.fullName || "User"}
            </h1>
            <p className="truncate text-sm text-slate-500">{profile.email}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {profile.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleEditToggle}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Pencil size={16} />
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

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

      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        <Input name="email" label="Email" value={profile.email} disabled />
        <Input name="role" label="Role" value={profile.role} disabled />
        <Input
          name="fullName"
          label="Full Name"
          autoComplete="name"
          value={values.fullName}
          error={errors.fullName}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          name="dateOfBirth"
          label="Date of Birth"
          type="date"
          max={new Date().toLocaleDateString("en-CA")}
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Select
          name="gender"
          label="Gender"
          options={GENDER_OPTIONS}
          value={values.gender}
          error={errors.gender}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          name="phone"
          label="Phone Number"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <Input
          name="address"
          label="Address"
          autoComplete="street-address"
          value={values.address}
          error={errors.address}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>

      {isEditing && (
        <div className="flex justify-end">
          <div className="w-full sm:w-44">
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
