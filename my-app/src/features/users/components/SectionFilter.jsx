import { memo } from "react";

// TODO(section-filter): hiện chưa lọc thật (theo yêu cầu), chỉ hiển thị UI.
// TODO(admin-section-api): khi có API section riêng cho Admin, bỏ `disabled`
// cho role ADMIN và truyền options tương ứng từ Accounts.jsx.
function SectionFilter({ value, onChange, options, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title={disabled ? "Section filtering is not available for admins" : undefined}
      className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
    >
      <option value="ALL">All Sections</option>
      {options.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}

export default memo(SectionFilter);
