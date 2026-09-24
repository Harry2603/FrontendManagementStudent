import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { courseManagementService } from "@/features/course-management/services/courseManagementService";

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

const initialCourse = {
  courseCode: "",
  courseName: "",
  credits: "3",
  description: "",
};

const initialSection = {
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || fallback;

const getPageFromParams = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

function Modal({ title, onClose, children }) {
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
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function CourseManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const pageNumber = getPageFromParams(searchParams.get("page"));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [course, setCourse] = useState(initialCourse);
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewedCourse, setViewedCourse] = useState(null);
  const [courseSections, setCourseSections] = useState([]);
  const sectionsPageNumber = getPageFromParams(searchParams.get("sectionPage"));
  const [sectionsTotalPages, setSectionsTotalPages] = useState(1);
  const [sectionsTotalItems, setSectionsTotalItems] = useState(0);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState("");
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [section, setSection] = useState(initialSection);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [sectionRefreshKey, setSectionRefreshKey] = useState(0);

  const updatePageParam = useCallback((name, page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(name, String(page));
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadCourses() {
      setPageLoading(true);
      setPageError("");
      try {
        const response = await courseManagementService.getCourses({ pageNumber });
        if (!ignore) {
          setCourses(response?.items ?? []);
          setTotalPages(response?.totalPages ?? 1);
          setTotalItems(response?.totalItems ?? 0);
        }
      } catch (error) {
        if (!ignore) setPageError(getErrorMessage(error, "Unable to load courses."));
      } finally {
        if (!ignore) setPageLoading(false);
      }
    }

    loadCourses();
    return () => {
      ignore = true;
    };
  }, [pageNumber]);

  useEffect(() => {
    if (!viewedCourse) return undefined;

    let ignore = false;

    async function loadCourseSections() {
      setSectionsLoading(true);
      setSectionsError("");
      try {
        const [firstSectionPage, firstTeacherPage] = await Promise.all([
          courseManagementService.getCourseSections({
            courseId: viewedCourse.id,
            pageNumber: sectionsPageNumber,
            pageSize: 10,
          }),
          courseManagementService.getTeachers({ pageSize: 100 }),
        ]);
        const remainingTeacherPages = await Promise.all(
          Array.from(
            { length: Math.max((firstTeacherPage?.totalPages ?? 1) - 1, 0) },
            (_, index) =>
              courseManagementService.getTeachers({
                pageNumber: index + 2,
                pageSize: 100,
              }),
          ),
        );
        const teachersByRoleId = new Map(
          [firstTeacherPage, ...remainingTeacherPages]
            .flatMap((page) => page?.items ?? [])
            .map((teacher) => [teacher.roleUserId, teacher]),
        );
        const sections = (firstSectionPage?.items ?? [])
          .map((item) => ({
            ...item,
            teacher: teachersByRoleId.get(item.teacherUserRoleId),
          }));

        if (!ignore) {
          setCourseSections(sections);
          if (
            firstSectionPage?.pageNumber &&
            firstSectionPage.pageNumber !== sectionsPageNumber
          ) {
            updatePageParam("sectionPage", firstSectionPage.pageNumber);
          }
          setSectionsTotalPages(firstSectionPage?.totalPages ?? 1);
          setSectionsTotalItems(firstSectionPage?.totalItems ?? 0);
        }
      } catch (error) {
        if (!ignore) {
          setSectionsError(getErrorMessage(error, "Unable to load course sections."));
        }
      } finally {
        if (!ignore) setSectionsLoading(false);
      }
    }

    loadCourseSections();
    return () => {
      ignore = true;
    };
  }, [viewedCourse, sectionsPageNumber, sectionRefreshKey]);

  useEffect(() => {
    if (!sectionModalOpen) return undefined;

    let ignore = false;
    async function loadSemesters() {
      try {
        const response = await courseManagementService.getSemesters();
        if (!ignore) setSemesters(Array.isArray(response) ? response : []);
      } catch (error) {
        if (!ignore) setSectionError(getErrorMessage(error, "Unable to load semesters."));
      }
    }
    loadSemesters();
    return () => {
      ignore = true;
    };
  }, [sectionModalOpen]);

  useEffect(() => {
    if (!sectionModalOpen) return undefined;

    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      setTeacherLoading(true);
      try {
        const response = await courseManagementService.getTeachers({ name: teacherSearch });
        if (!ignore) setTeachers(response?.items ?? []);
      } catch (error) {
        if (!ignore) setSectionError(getErrorMessage(error, "Unable to load teachers."));
      } finally {
        if (!ignore) setTeacherLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [sectionModalOpen, teacherSearch]);

  const closeCourseModal = () => {
    if (courseSubmitting) return;
    setCourseModalOpen(false);
    setCourse(initialCourse);
    setCourseError("");
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    setCourseError("");

    if (!course.courseCode.trim() || !course.courseName.trim() || !course.credits) {
      setCourseError("Course code, course name, and credits are required.");
      return;
    }

    setCourseSubmitting(true);
    try {
      const created = await courseManagementService.createCourse({
        courseCode: course.courseCode.trim(),
        courseName: course.courseName.trim(),
        credits: Number(course.credits),
        description: course.description.trim() || null,
      });
      setCourses((items) => [created, ...items].slice(0, 10));
      setTotalItems((count) => count + 1);
      setSuccessMessage(`${created.courseCode} was created and added to the top of the table.`);
      setCourseModalOpen(false);
      setCourse(initialCourse);
    } catch (error) {
      setCourseError(getErrorMessage(error, "Unable to create the course."));
    } finally {
      setCourseSubmitting(false);
    }
  };

  const openSectionModal = () => {
    setSection({ ...initialSection, sectionCode: `${viewedCourse.courseCode}-01` });
    updatePageParam("sectionPage", 1);
    setTeacherSearch("");
    setSectionError("");
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    if (sectionSubmitting) return;
    setSectionModalOpen(false);
    setSection(initialSection);
    setSectionError("");
  };

  const selectSemester = (event) => {
    const semesterId = event.target.value;
    const semester = semesters.find((item) => String(item.id) === semesterId);
    setSection((current) => ({
      ...current,
      semesterId,
      startDate: semester?.startDate ?? current.startDate,
      endDate: semester?.endDate ?? current.endDate,
    }));
  };

  const submitSection = async (event) => {
    event.preventDefault();
    setSectionError("");

    if (!section.semesterId || !section.teacherUserRoleId || !section.sectionCode.trim() || !section.startDate || !section.endDate) {
      setSectionError("Complete all required section fields.");
      return;
    }
    if (Number(section.endPeriod) < Number(section.startPeriod)) {
      setSectionError("End period must be after or equal to start period.");
      return;
    }

    setSectionSubmitting(true);
    try {
      const created = await courseManagementService.createCourseSection({
        courseId: viewedCourse.id,
        semesterId: Number(section.semesterId),
        teacherUserRoleId: Number(section.teacherUserRoleId),
        sectionCode: section.sectionCode.trim(),
        capacity: Number(section.capacity),
        dayOfWeek: section.dayOfWeek,
        startPeriod: Number(section.startPeriod),
        endPeriod: Number(section.endPeriod),
        startDate: section.startDate,
        endDate: section.endDate,
        status: "OPEN",
      });
      setSuccessMessage(`Section ${created.sectionCode} was created and is open for enrollment.`);
      setSectionModalOpen(false);
      setSection(initialSection);
      updatePageParam("sectionPage", 1);
      setSectionRefreshKey((key) => key + 1);
    } catch (error) {
      setSectionError(getErrorMessage(error, "Unable to create the course section."));
    } finally {
      setSectionSubmitting(false);
    }
  };

  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p role="alert" className="text-sm text-red-600">
          {pageError}
        </p>
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Course Management
          </h1>
        </div>
        {viewedCourse ? (
          <button
            type="button"
            onClick={openSectionModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} /> Create course section
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCourseModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} /> Create course
          </button>
        )}
      </div>

      {successMessage && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={17} />
          {successMessage}
        </p>
      )}

      {viewedCourse ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={() => setViewedCourse(null)}
              aria-label="Back to courses"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <p className="text-sm font-semibold text-blue-600">
                {viewedCourse.courseCode}
              </p>
              <h2 className="font-semibold text-slate-900">
                {viewedCourse.courseName}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {viewedCourse.credits} credits
              </p>
            </div>
          </div>

          {sectionsError && (
            <p role="alert" className="border-b border-slate-200 px-5 py-3 text-sm text-red-600">
              {sectionsError}
            </p>
          )}

          {sectionsLoading ? (
            <div className="flex justify-center px-5 py-14">
              <LoaderCircle className="animate-spin text-blue-600" size={24} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Section</th>
                    <th className="px-5 py-3">Teacher</th>
                    <th className="px-5 py-3">Schedule</th>
                    <th className="px-5 py-3 text-center">Capacity</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseSections.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                        No course sections have been created yet.
                      </td>
                    </tr>
                  ) : (
                    courseSections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                          {item.sectionCode ?? "_"}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <p className="font-medium text-slate-800">
                            Teacher: {item.teacher?.fullName ?? "_"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.teacher?.email ?? "_"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.teacher?.phone ?? "_"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {DAYS.find((day) => day.value === item.dayOfWeek)?.label ?? item.dayOfWeek} · Period {item.startPeriod}–{item.endPeriod}
                        </td>
                        <td className="px-5 py-4 text-center text-sm font-medium text-slate-700">
                          {item.enrollmentCount ?? 0} / {item.capacity ?? "_"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.startDate ?? "_"} – {item.endDate ?? "_"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : item.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {item.status ?? "_"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {sectionsTotalPages > 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3 text-sm">
              <button
                type="button"
                disabled={sectionsPageNumber <= 1 || sectionsLoading}
                onClick={() => updatePageParam("sectionPage", sectionsPageNumber - 1)}
                className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-slate-500">
                Page {sectionsPageNumber} of {sectionsTotalPages} ({sectionsTotalItems} sections)
              </span>
              <button
                type="button"
                disabled={sectionsPageNumber >= sectionsTotalPages || sectionsLoading}
                onClick={() => updatePageParam("sectionPage", sectionsPageNumber + 1)}
                className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">All courses</h2>
            <p className="mt-1 text-sm text-slate-500">{totalItems} courses in total</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Course name</th>
                  <th className="px-5 py-3 text-center">Credits</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                        <button
                          type="button"
                          onClick={() => {
                            updatePageParam("sectionPage", 1);
                            setViewedCourse(item);
                          }}
                          className="hover:underline"
                        >
                          {item.courseCode}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            updatePageParam("sectionPage", 1);
                            setViewedCourse(item);
                          }}
                          className="text-left hover:text-blue-600 hover:underline"
                        >
                          {item.courseName}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-slate-700">
                        {item.credits}
                      </td>
                      <td className="max-w-sm px-5 py-4 text-sm text-slate-600">
                        {item.description || "_"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3 text-sm">
              <button type="button" disabled={pageNumber === 1} onClick={() => updatePageParam("page", pageNumber - 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400">
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-slate-500">Page {pageNumber} of {totalPages}</span>
              <button type="button" disabled={pageNumber === totalPages} onClick={() => updatePageParam("page", pageNumber + 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400">
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {courseModalOpen && (
        <Modal title="Create course" onClose={closeCourseModal}>
          <form onSubmit={submitCourse} className="space-y-5 p-6">
            {courseError && <p role="alert" className="text-sm text-red-600">{courseError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Course code
                <input name="courseCode" value={course.courseCode} onChange={(event) => setCourse((current) => ({ ...current, courseCode: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Credits
                <input name="credits" type="number" min="1" value={course.credits} onChange={(event) => setCourse((current) => ({ ...current, credits: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Course name
              <input name="courseName" value={course.courseName} onChange={(event) => setCourse((current) => ({ ...current, courseName: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Description <span className="font-normal text-slate-400">(optional)</span>
              <textarea name="description" rows="4" value={course.description} onChange={(event) => setCourse((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeCourseModal} disabled={courseSubmitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={courseSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {courseSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                Create course
              </button>
            </div>
          </form>
        </Modal>
      )}

      {sectionModalOpen && viewedCourse && (
        <Modal
          title={`Create course section — ${viewedCourse.courseCode}`}
          onClose={closeSectionModal}
        >
          <form onSubmit={submitSection} className="space-y-5 p-6">
            {sectionError && (
              <p role="alert" className="text-sm text-red-600">
                {sectionError}
              </p>
            )}
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Semester
              <select
                value={section.semesterId}
                onChange={selectSemester}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.academicYear?.name} — {semester.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="teacher-search">
                Assign teacher
              </label>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="teacher-search"
                  value={teacherSearch}
                  onChange={(event) => setTeacherSearch(event.target.value)}
                  placeholder="Search teacher name..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <select
                value={section.teacherUserRoleId}
                onChange={(event) => setSection((current) => ({ ...current, teacherUserRoleId: event.target.value }))}
                required
                disabled={teacherLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              >
                <option value="">{teacherLoading ? "Loading teachers..." : "Select a teacher"}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.roleUserId} value={teacher.roleUserId}>
                    {teacher.fullName} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Section code<input value={section.sectionCode} onChange={(event) => setSection((current) => ({ ...current, sectionCode: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Capacity<input type="number" min="1" max="100" value={section.capacity} onChange={(event) => setSection((current) => ({ ...current, capacity: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Day<select value={section.dayOfWeek} onChange={(event) => setSection((current) => ({ ...current, dayOfWeek: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">{DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Start period<input type="number" min="1" max="10" value={section.startPeriod} onChange={(event) => setSection((current) => ({ ...current, startPeriod: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">End period<input type="number" min="1" max="10" value={section.endPeriod} onChange={(event) => setSection((current) => ({ ...current, endPeriod: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Start date<input disabled type="date" value={section.startDate} onChange={(event) => setSection((current) => ({ ...current, startDate: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">End date<input disabled type="date" value={section.endDate} onChange={(event) => setSection((current) => ({ ...current, endDate: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeSectionModal} disabled={sectionSubmitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={sectionSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{sectionSubmitting && <LoaderCircle size={16} className="animate-spin" />}Create course section</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
