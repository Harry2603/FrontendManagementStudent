import { memo } from "react";

const TABS = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "TEACHER", label: "Giảng viên" },
];

// memo: RoleTabs chỉ phụ thuộc value/onChange/canSeeTeacherTab, tránh re-render
// khi Accounts.jsx re-render do search hoặc data thay đổi.
function RoleTabs({ value, onChange, canSeeTeacherTab }) {
  const tabs = canSeeTeacherTab
    ? TABS
    : TABS.filter((t) => t.value === "STUDENT");

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white hover:text-blue-600 ${
            value === tab.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default memo(RoleTabs);
