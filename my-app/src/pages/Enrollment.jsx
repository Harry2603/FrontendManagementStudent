import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  X,
  Search,
} from "lucide-react";
import { Table } from "@/components/ui/Table";
import PageLoader from "@/components/common/PageLoader";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";

const dayLabels = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const formatSection = (section) => ({
  ...section,
  sectionId: section.sectionId ?? section.id,
  code: section.sectionCode,
  name: `${section.course.courseName}`,
  schedule: `${dayLabels[section.dayOfWeek] ?? section.dayOfWeek}, ${section.startPeriod} - ${section.endPeriod}`,
});

export default function EnrollmentPage() {
  const [activeTab, setActiveTab] = useState("available");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availablePage, setAvailablePage] = useState(1);
  const [enrolledPage, setEnrolledPage] = useState(1);
  const [availableTotalPages, setAvailableTotalPages] = useState(1);
  const [enrolledTotalPages, setEnrolledTotalPages] = useState(1);
  const pageSize = 10;
  const tabs = [
    { id: "available", label: "Course Registration", icon: BookOpen },
    { id: "enrolled", label: "Enrolled Courses", icon: Check },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();

  const sourceCourses =
    activeTab === "available" ? availableCourses : enrolledCourses;

  const keyword = normalize(searchTerm.trim());
  useEffect(() => {
    let ignore = false;

    async function fetchSections() {
      if (refreshKey === 0) setPageLoading(true); // chỉ hiện loader toàn trang lần đầu
      setPageError("");
      try {
        const [openRes, myRes] = await Promise.all([
          courseSectionService.getOpenSections({
            pageNumber: availablePage,
            pageSize,
          }),
          courseSectionService.getMySections({
            pageNumber: enrolledPage,
            pageSize,
          }),
        ]);
        if (!ignore) {
          setAvailableCourses((openRes?.items ?? []).map(formatSection));
          setEnrolledCourses((myRes?.items ?? []).map(formatSection));
          setAvailableTotalPages(Math.max(openRes?.totalPages ?? 1, 1));
          setEnrolledTotalPages(Math.max(myRes?.totalPages ?? 1, 1));
        }
      } catch (error) {
        if (!ignore) {
          setPageError(
            error?.response?.data?.message ||
              "Unable to load course sections. Please try again.",
          );
        }
      } finally {
        if (!ignore) setPageLoading(false);
      }
    }

    fetchSections();
    return () => {
      ignore = true;
    };
  }, [refreshKey, availablePage, enrolledPage]);
  const courses = keyword
    ? sourceCourses.filter((course) =>
        [course.code, course.name, course.schedule].some((value) =>
          normalize(value).includes(keyword),
        ),
      )
    : sourceCourses;
  const toggleSection = (sectionId) => {
    setSelectedSectionIds((currentIds) =>
      currentIds.includes(sectionId)
        ? currentIds.filter((id) => id !== sectionId)
        : [...currentIds, sectionId],
    );
  };

  const submitEnrollment = async () => {
    if (selectedSectionIds.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const response = await courseSectionService.postEnrolls({
        enrollments: selectedSectionIds.map((sectionId) => ({ sectionId })),
      });
      setEnrollmentResult(response);
      setSelectedSectionIds([]);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setEnrollmentResult({
        error:
          error?.response?.data?.message ||
          "Course registration failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const codeBySectionId = Object.fromEntries(
    availableCourses.map((course) => [course.sectionId, course.code]),
  );
  const basecolumns = [
    {
      key: "code",
      header: "Section Code",
      sortable: true,
      render: (course) => (
        <span className="font-semibold text-blue-600">{course.code}</span>
      ),
    },
    { key: "name", header: "Course", sortable: true },
    {
      key: "capacity",
      header: "Max Capacity",
      sortable: true,
      render: (course) =>
        `${course.enrollmentCount ?? "N/A"}/${course.capacity ?? "N/A"}`,
    },
    { key: "schedule", header: "Schedule" },
  ];
  const enrolledSectionIds = new Set(
    enrolledCourses.map((course) => course.sectionId),
  );
  const availableColumns = [
    ...basecolumns,
    {
      key: "action",
      header: "Register",
      render: (course) => {
        const isEnrolled = enrolledSectionIds.has(course.sectionId);
        return (
          <input
            type="checkbox"
            checked={
              isEnrolled || selectedSectionIds.includes(course.sectionId)
            }
            disabled={isEnrolled}
            onChange={() => toggleSection(course.sectionId)}
            aria-label={`Select course section ${course.code}`}
            title={
              isEnrolled
                ? "You are already enrolled in this section"
                : undefined
            }
            className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
        );
      },
    },
  ];
  const columns = activeTab === "available" ? availableColumns : basecolumns;
  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow">
        <p role="alert" className="text-sm text-red-600">
          {pageError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Academics
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Course Registration
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your course sections for the current semester.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <div
          className="flex gap-6 overflow-x-auto"
          role="tablist"
          aria-label="Enrollment views"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-blue-300 hover:text-blue-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {activeTab === "available"
                ? "Available Course Sections"
                : "Your Enrolled Courses"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Semester 1, academic year 2026 - 2027
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={selectedSectionIds.length === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-9 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              Register
            </button>
          </div>
        </div>
        <div className="border-b border-slate-200 px-5 py-3">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by section code, course, or schedule..."
              aria-label="Search course sections"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div role="tabpanel">
          <Table
            columns={columns}
            data={courses}
            rowKey={(course) => course.sectionId}
            emptyMessage="No course sections found"
          />
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-5 py-3 text-sm">
          <button
            type="button"
            onClick={() =>
              activeTab === "available"
                ? setAvailablePage((page) => page - 1)
                : setEnrolledPage((page) => page - 1)
            }
            disabled={
              pageLoading ||
              (activeTab === "available"
                ? availablePage === 1
                : enrolledPage === 1)
            }
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="text-slate-600">
            Page {activeTab === "available" ? availablePage : enrolledPage} of{" "}
            {activeTab === "available"
              ? availableTotalPages
              : enrolledTotalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              activeTab === "available"
                ? setAvailablePage((page) => page + 1)
                : setEnrolledPage((page) => page + 1)
            }
            disabled={
              pageLoading ||
              (activeTab === "available"
                ? availablePage >= availableTotalPages
                : enrolledPage >= enrolledTotalPages)
            }
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {enrollmentResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEnrollmentResult(null);
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-result-title"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <h2
                id="enrollment-result-title"
                className="text-lg font-semibold text-slate-900"
              >
                Registration Results
              </h2>
              <button
                type="button"
                onClick={() => setEnrollmentResult(null)}
                aria-label="Close"
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {enrollmentResult.error ? (
              <p className="border-t border-slate-100 px-6 py-5 text-base text-red-600">
                Registration failed
              </p>
            ) : (
              <ul className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
                {(enrollmentResult.results ?? []).map((result, index) => {
                  const isSuccess = result.status?.toLowerCase() === "success";
                  return (
                    <li
                      key={`${result.sectionId}-${index}`}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <span className="text-base font-medium text-slate-800">
                        {codeBySectionId[result.sectionId] ?? result.sectionId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {isSuccess ? <Check size={15} /> : <X size={15} />}
                        {isSuccess ? "Success" : "Failed"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
