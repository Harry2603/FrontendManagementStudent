import { X } from "lucide-react";

export const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export const initialCourse = {
  courseCode: "",
  courseName: "",
  credits: "3",
  description: "",
};

export const initialSection = {
  semesterId: "",
  teacherUserRoleId: "",
  sectionCode: "",
  capacity: "30",
  dayOfWeek: "MONDAY",
  startPeriod: "1",
  endPeriod: "3",
  startDate: "",
  endDate: "",
};

export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || fallback;

export const getPageFromParams = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="course-modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
