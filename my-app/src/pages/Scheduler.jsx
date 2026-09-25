import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ROLES } from "@/config/constants";
import { useAuth } from "@/features/auth";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";

const PERIOD_TIMES = {
  1: ["07:00", "07:50"],
  2: ["07:50", "08:40"],
  3: ["08:50", "09:40"],
  4: ["09:40", "10:30"],
  5: ["10:40", "11:30"],
  6: ["13:00", "13:50"],
  7: ["13:50", "14:40"],
  8: ["14:50", "15:40"],
  9: ["15:40", "16:30"],
  10: ["16:40", "17:30"],
};

const WEEK_DAYS = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
];

const parseDate = (value) => new Date(`${value}T00:00:00`);

const getStartOfWeek = (date) => startOfWeek(date, { weekStartsOn: 1 });

const getEndOfWeek = (date) => addDays(getStartOfWeek(date), 6);

const isSectionActiveOnDate = (section, date) => {
  const day = format(date, "yyyy-MM-dd");
  return day >= section.startDate && day <= section.endDate;
};

const getScheduleByDay = (sections, selectedDate) => {
  const weekStart = getStartOfWeek(selectedDate);

  return WEEK_DAYS.map((day, dayIndex) => ({
    ...day,
    date: addDays(weekStart, dayIndex),
    sections: sections.filter(
      (section) =>
        section.dayOfWeek === day.key &&
        isSectionActiveOnDate(section, addDays(weekStart, dayIndex)),
    ),
  }));
};

const getDateInputValue = (date) => format(date, "yyyy-MM-dd");

function SectionCard({ section }) {
  const [startTime] = PERIOD_TIMES[section.startPeriod] ?? ["--:--"];
  const [, endTime] = PERIOD_TIMES[section.endPeriod] ?? ["--:--", "--:--"];

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-red-900">
      <div className="font-bold">{section.course?.courseCode ?? "Course"}</div>
      <div className="mt-1 text-xs font-medium">
        {section.course?.courseName ?? "Unnamed course"}
      </div>
      <div className="mt-2 text-xs text-red-700">
        {section.sectionCode || "No section code"} · {section.status || "N/A"}
      </div>
      <div className="mt-1 text-xs font-medium text-red-700">
        Period {section.startPeriod}-{section.endPeriod} · {startTime}-{endTime}
      </div>
    </div>
  );
}

export default function Scheduler() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const getSections =
      user?.role === ROLES.TEACHER
        ? courseSectionService.getTeacherSections
        : courseSectionService.getMySections;

    async function loadSections() {
      try {
        const firstPage = await getSections({ pageNumber: 1, pageSize: 100 });
        const totalPages = Math.max(firstPage?.totalPages ?? 1, 1);
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            getSections({ pageNumber: index + 2, pageSize: 100 }),
          ),
        );
        const items = [firstPage, ...remainingPages].flatMap(
          (response) => response?.items ?? [],
        );

        if (!ignore) {
          setSections(items);
          setError("");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError?.response?.data?.message ||
              "Unable to load your schedule. Please try again.",
          );
          setSections([]);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadSections();
    return () => {
      ignore = true;
    };
  }, [user?.role]);

  const scheduleByDay = useMemo(
    () => getScheduleByDay(sections, selectedDate),
    [sections, selectedDate],
  );
  const weekStart = getStartOfWeek(selectedDate);
  const weekEnd = getEndOfWeek(selectedDate);
  const sectionsThisWeek = scheduleByDay.flatMap((day) => day.sections);

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Academic planner
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Schedule</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your timetable for the current semester.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(addWeeks(selectedDate, -1))}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Previous week"
            title="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Next week"
            title="Next week"
          >
            <ChevronRight size={18} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <Calendar size={17} />
              Chọn ngày
            </button>
            {isDatePickerOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <label className="block text-xs font-semibold text-slate-500" htmlFor="schedule-date">
                  Select date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={getDateInputValue(selectedDate)}
                  onChange={(event) => {
                    setSelectedDate(parseDate(event.target.value));
                    setIsDatePickerOpen(false);
                  }}
                  className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">
            {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
          </p>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{sectionsThisWeek.length}</span> scheduled sessions
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center text-sm text-slate-500">
            Loading schedule...
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-32 border-b border-r border-white bg-slate-200 p-3 text-left font-semibold text-slate-700">
                  Period
                </th>
                {scheduleByDay.map((day) => (
                  <th key={day.key} className="border-b border-r border-white bg-slate-100 p-3 text-center font-semibold text-slate-700 last:border-r-0">
                    <div>{day.label}</div>
                    <div className="mt-1 text-xs font-normal text-slate-500">{format(day.date, "dd/MM")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERIOD_TIMES).map(([period, [start, end]]) => (
                <tr key={period}>
                  <th className="border-b border-r border-white bg-slate-200 p-3 text-left align-top font-medium text-slate-600">
                    <div>Period {period}</div>
                    <div className="mt-1 text-xs font-normal">{start} - {end}</div>
                  </th>
                  {scheduleByDay.map((day) => {
                    const section = day.sections.find(
                      (item) => Number(item.startPeriod) === Number(period),
                    );
                    const coveredBySection = day.sections.some(
                      (item) =>
                        Number(item.startPeriod) < Number(period) &&
                        Number(item.endPeriod) >= Number(period),
                    );

                    if (coveredBySection) return null;

                    return (
                      <td
                        key={`${day.key}-${period}`}
                        rowSpan={section ? section.endPeriod - section.startPeriod + 1 : 1}
                        className={`border-b border-r border-white  p-2 text-center align-middle last:border-r-0 ${
                        "bg-slate-50"
                        }`}
                      >
                        {section && <SectionCard section={section} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            </table>
            </div>
            <div className="space-y-3 md:hidden">
            {scheduleByDay.map((day) => (
              <section key={day.key} className="rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-2">
                  <h2 className="font-semibold text-slate-800">{day.label}</h2>
                  <span className="text-xs text-slate-500">{format(day.date, "dd/MM/yyyy")}</span>
                </div>
                <div className="space-y-2 p-2">
                  {day.sections.length > 0 ? (
                    day.sections.map((section) => (
                      <SectionCard key={section.id} section={section} />
                    ))
                  ) : (
                    <p className="px-2 py-3 text-center text-sm text-slate-500">
                      No classes
                    </p>
                  )}
                </div>
              </section>
            ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
