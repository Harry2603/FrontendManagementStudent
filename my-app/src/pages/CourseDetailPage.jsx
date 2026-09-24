import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { courseManagementService } from "@/features/course-management/services/courseManagementService";
import { DAYS, getErrorMessage, getPageFromParams, initialSection, Modal } from "./courseManagementShared";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageNumber = getPageFromParams(searchParams.get("page"));
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [courseSections, setCourseSections] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
  const [successMessage, setSuccessMessage] = useState("");
  const [sectionRefreshKey, setSectionRefreshKey] = useState(0);

  const updatePage = useCallback((page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(page));
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let ignore = false;
    async function loadCourse() {
      setCourseLoading(true);
      setCourseError("");
      try {
        const response = await courseManagementService.getCourseById(id);
        if (!ignore) setCourse(response);
      } catch (error) {
        if (!ignore) setCourseError(getErrorMessage(error, "Unable to load the course."));
      } finally {
        if (!ignore) setCourseLoading(false);
      }
    }
    loadCourse();
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function loadCourseSections() {
      setSectionsLoading(true);
      setSectionsError("");
      try {
        const [firstSectionPage, firstTeacherPage] = await Promise.all([
          courseManagementService.getCourseSections({ courseId: id, pageNumber, pageSize: 10 }),
          courseManagementService.getTeachers({ pageSize: 100 }),
        ]);
        const remainingTeacherPages = await Promise.all(Array.from(
          { length: Math.max((firstTeacherPage?.totalPages ?? 1) - 1, 0) },
          (_, index) => courseManagementService.getTeachers({ pageNumber: index + 2, pageSize: 100 }),
        ));
        const teachersByRoleId = new Map(
          [firstTeacherPage, ...remainingTeacherPages].flatMap((page) => page?.items ?? []).map((teacher) => [teacher.roleUserId, teacher]),
        );
        const sections = (firstSectionPage?.items ?? []).map((item) => ({ ...item, teacher: teachersByRoleId.get(item.teacherUserRoleId) }));
        if (!ignore) {
          setCourseSections(sections);
          setTotalPages(firstSectionPage?.totalPages ?? 1);
          setTotalItems(firstSectionPage?.totalItems ?? 0);
          if (firstSectionPage?.pageNumber && firstSectionPage.pageNumber !== pageNumber) updatePage(firstSectionPage.pageNumber);
        }
      } catch (error) {
        if (!ignore) setSectionsError(getErrorMessage(error, "Unable to load course sections."));
      } finally {
        if (!ignore) setSectionsLoading(false);
      }
    }
    loadCourseSections();
    return () => { ignore = true; };
  }, [id, pageNumber, sectionRefreshKey, updatePage]);

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
    return () => { ignore = true; };
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
    return () => { ignore = true; window.clearTimeout(timeoutId); };
  }, [sectionModalOpen, teacherSearch]);

  const openSectionModal = () => {
    setSection({ ...initialSection, sectionCode: `${course.courseCode}-01` });
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
    setSection((current) => ({ ...current, semesterId, startDate: semester?.startDate ?? current.startDate, endDate: semester?.endDate ?? current.endDate }));
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
        courseId: id,
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
      updatePage(1);
      setSectionRefreshKey((key) => key + 1);
    } catch (error) {
      setSectionError(getErrorMessage(error, "Unable to create the course section."));
    } finally {
      setSectionSubmitting(false);
    }
  };

  if (courseLoading) return <PageLoader />;
  if (courseError) return <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p role="alert" className="text-sm text-red-600">{courseError}</p></div>;
  if (!course) return null;

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} aria-label="Back to courses" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><ArrowLeft size={19} /></button><div><h1 className="mt-1 text-3xl font-bold text-slate-900">Course Management</h1><p className="mt-1 text-sm font-semibold text-blue-600">{course.courseCode}</p><p className="font-semibold text-slate-900">{course.courseName} <span className="font-normal text-slate-500">({course.credits} credits)</span></p></div></div>
        <button type="button" onClick={openSectionModal} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Create course section</button>
      </div>
      {successMessage && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} />{successMessage}</p>}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {sectionsError && <p role="alert" className="border-b border-slate-200 px-5 py-3 text-sm text-red-600">{sectionsError}</p>}
        {sectionsLoading ? <div className="flex justify-center px-5 py-14"><LoaderCircle className="animate-spin text-blue-600" size={24} /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Section</th><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3 text-center">Capacity</th><th className="px-5 py-3">Dates</th><th className="px-5 py-3 text-center">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{courseSections.length === 0 ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">No course sections have been created yet.</td></tr> : courseSections.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-sm font-semibold text-blue-600">{item.sectionCode ?? "_"}</td><td className="px-5 py-4 text-sm"><p className="font-medium text-slate-800">Teacher: {item.teacher?.fullName ?? "_"}</p><p className="mt-0.5 text-xs text-slate-500">{item.teacher?.email ?? "_"}</p><p className="mt-0.5 text-xs text-slate-500">{item.teacher?.phone ?? "_"}</p></td><td className="px-5 py-4 text-sm text-slate-700">{DAYS.find((day) => day.value === item.dayOfWeek)?.label ?? item.dayOfWeek} · Period {item.startPeriod}–{item.endPeriod}</td><td className="px-5 py-4 text-center text-sm font-medium text-slate-700">{item.enrollmentCount ?? 0} / {item.capacity ?? "_"}</td><td className="px-5 py-4 text-sm text-slate-700">{item.startDate ?? "_"} – {item.endDate ?? "_"}</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : item.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{item.status ?? "_"}</span></td></tr>)}</tbody></table></div>}
        {totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3 text-sm"><button type="button" disabled={pageNumber <= 1 || sectionsLoading} onClick={() => updatePage(pageNumber - 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400"><ChevronLeft size={16} /> Previous</button><span className="text-slate-500">Page {pageNumber} of {totalPages} ({totalItems} sections)</span><button type="button" disabled={pageNumber >= totalPages || sectionsLoading} onClick={() => updatePage(pageNumber + 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400">Next <ChevronRight size={16} /></button></div>}
      </div>
      {sectionModalOpen && <Modal title={`Create course section — ${course.courseCode}`} onClose={closeSectionModal}><form onSubmit={submitSection} className="space-y-5 p-6">
        {sectionError && <p role="alert" className="text-sm text-red-600">{sectionError}</p>}
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">Semester<select value={section.semesterId} onChange={selectSemester} required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"><option value="">Select a semester</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.academicYear?.name} — {semester.name}</option>)}</select></label>
        <div className="space-y-2"><label className="text-sm font-medium text-slate-700" htmlFor="teacher-search">Assign teacher</label><div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="teacher-search" value={teacherSearch} onChange={(event) => setTeacherSearch(event.target.value)} placeholder="Search teacher name..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></div><select value={section.teacherUserRoleId} onChange={(event) => setSection((current) => ({ ...current, teacherUserRoleId: event.target.value }))} required disabled={teacherLoading} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"><option value="">{teacherLoading ? "Loading teachers..." : "Select a teacher"}</option>{teachers.map((teacher) => <option key={teacher.roleUserId} value={teacher.roleUserId}>{teacher.fullName} ({teacher.email})</option>)}</select></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-slate-700">Section code<input value={section.sectionCode} onChange={(event) => setSection((current) => ({ ...current, sectionCode: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label><label className="space-y-1.5 text-sm font-medium text-slate-700">Capacity<input type="number" min="1" max="100" value={section.capacity} onChange={(event) => setSection((current) => ({ ...current, capacity: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label></div>
        <div className="grid gap-4 sm:grid-cols-3"><label className="space-y-1.5 text-sm font-medium text-slate-700">Day<select value={section.dayOfWeek} onChange={(event) => setSection((current) => ({ ...current, dayOfWeek: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">{DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label><label className="space-y-1.5 text-sm font-medium text-slate-700">Start period<input type="number" min="1" max="10" value={section.startPeriod} onChange={(event) => setSection((current) => ({ ...current, startPeriod: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label><label className="space-y-1.5 text-sm font-medium text-slate-700">End period<input type="number" min="1" max="10" value={section.endPeriod} onChange={(event) => setSection((current) => ({ ...current, endPeriod: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-slate-700">Start date<input disabled type="date" value={section.startDate} onChange={(event) => setSection((current) => ({ ...current, startDate: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label><label className="space-y-1.5 text-sm font-medium text-slate-700">End date<input disabled type="date" value={section.endDate} onChange={(event) => setSection((current) => ({ ...current, endDate: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label></div>
        <div className="flex justify-end gap-3"><button type="button" onClick={closeSectionModal} disabled={sectionSubmitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={sectionSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{sectionSubmitting && <LoaderCircle size={16} className="animate-spin" />}Create course section</button></div>
      </form></Modal>}
    </section>
  );
}
