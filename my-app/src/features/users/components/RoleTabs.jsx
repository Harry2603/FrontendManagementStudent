import { memo } from "react";

const TABS = [
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
];

function RoleTabs({ value, onChange, canSeeTeacherTab }) {
  const tabs = canSeeTeacherTab
    ? TABS
    : TABS.filter((t) => t.value === "STUDENT");
  const activeIndex = tabs.findIndex((tab) => tab.value === value);

  return (
    <div
      className="relative inline-flex rounded-xl border border-slate-200 bg-slate-100 shadow-inner shadow-slate-200/60"
      style={{ gap: "0.25rem", padding: "0.25rem" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - ${(tabs.length - 1) * 0.25}rem) / ${tabs.length})`,
          transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
        }}
      />

      {tabs.map((tab) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative z-10 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
            style={{ minWidth: "7.25rem" }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default memo(RoleTabs);
