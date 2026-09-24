import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Plus } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { courseManagementService } from "@/features/course-management/services/courseManagementService";
import {
  getErrorMessage,
  getPageFromParams,
  initialCourse,
  Modal,
} from "./courseManagementShared";

export default function CourseListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageNumber = getPageFromParams(searchParams.get("page"));
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [course, setCourse] = useState(initialCourse);
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updatePage = useCallback((page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(page));
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
    return () => { ignore = true; };
  }, [pageNumber]);

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

  if (pageLoading) return <PageLoader />;
  if (pageError) {
    return <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p role="alert" className="text-sm text-red-600">{pageError}</p></div>;
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Course Management</h1>
        <button type="button" onClick={() => setCourseModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus size={17} /> Create course
        </button>
      </div>
      {successMessage && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} />{successMessage}</p>}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">All courses</h2><p className="mt-1 text-sm text-slate-500">{totalItems} courses in total</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Course name</th><th className="px-5 py-3 text-center">Credits</th><th className="px-5 py-3">Description</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {courses.length === 0 ? <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">No courses found.</td></tr> : courses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-semibold text-blue-600"><button type="button" onClick={() => navigate(`/courses/${item.id}`)} className="hover:underline">{item.courseCode}</button></td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-800"><button type="button" onClick={() => navigate(`/courses/${item.id}`)} className="text-left hover:text-blue-600 hover:underline">{item.courseName}</button></td>
                  <td className="px-5 py-4 text-center text-sm text-slate-700">{item.credits}</td>
                  <td className="max-w-sm px-5 py-4 text-sm text-slate-600">{item.description || "_"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3 text-sm"><button type="button" disabled={pageNumber === 1} onClick={() => updatePage(pageNumber - 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400"><ChevronLeft size={16} /> Previous</button><span className="text-slate-500">Page {pageNumber} of {totalPages}</span><button type="button" disabled={pageNumber === totalPages} onClick={() => updatePage(pageNumber + 1)} className="inline-flex items-center gap-1 text-blue-600 disabled:text-slate-400">Next <ChevronRight size={16} /></button></div>}
      </div>
      {courseModalOpen && <Modal title="Create course" onClose={closeCourseModal}><form onSubmit={submitCourse} className="space-y-5 p-6">
        {courseError && <p role="alert" className="text-sm text-red-600">{courseError}</p>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-slate-700">Course code<input name="courseCode" value={course.courseCode} onChange={(event) => setCourse((current) => ({ ...current, courseCode: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label><label className="space-y-1.5 text-sm font-medium text-slate-700">Credits<input name="credits" type="number" min="1" value={course.credits} onChange={(event) => setCourse((current) => ({ ...current, credits: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label></div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">Course name<input name="courseName" value={course.courseName} onChange={(event) => setCourse((current) => ({ ...current, courseName: event.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea name="description" rows="4" value={course.description} onChange={(event) => setCourse((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
        <div className="flex justify-end gap-3"><button type="button" onClick={closeCourseModal} disabled={courseSubmitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={courseSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{courseSubmitting && <LoaderCircle size={16} className="animate-spin" />}Create course</button></div>
      </form></Modal>}
    </section>
  );
}
