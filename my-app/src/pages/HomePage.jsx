import { useEffect, useState } from "react";
import { BookOpen, Layers3, GraduationCap, Users } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { dashboardService } from "@/features/dashboard/services/dashboardService";

const analytics = [
  { key: "students", label: "Students", icon: Users, color: "bg-blue-50 text-blue-600" },
  { key: "teachers", label: "Teachers", icon: GraduationCap, color: "bg-indigo-50 text-indigo-600" },
  { key: "courses", label: "Courses", icon: BookOpen, color: "bg-emerald-50 text-emerald-600" },
  { key: "sections", label: "Course sections", icon: Layers3, color: "bg-amber-50 text-amber-600" },
];

const initialCounts = { students: null, teachers: null, courses: null, sections: null };

const getActiveSemester = (semesters) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return semesters.find((semester) => {
    const startDate = new Date(semester.startDate);
    const endDate = new Date(semester.endDate);
    endDate.setHours(23, 59, 59, 999);
    return today >= startDate && today <= endDate;
  });
};

export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);
  const [activeSemester, setActiveSemester] = useState(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return undefined;

    let ignore = false;
    async function loadAnalytics() {
      setLoading(true);
      const results = await Promise.allSettled([
        dashboardService.getStudentCount(),
        dashboardService.getTeacherCount(),
        dashboardService.getCourseCount(),
        dashboardService.getCourseSectionCount(),
        dashboardService.getSemesters(),
      ]);
      if (!ignore) {
        setCounts({
          students: results[0].status === "fulfilled" ? results[0].value?.totalItems ?? 0 : null,
          teachers: results[1].status === "fulfilled" ? results[1].value?.totalItems ?? 0 : null,
          courses: results[2].status === "fulfilled" ? results[2].value?.totalItems ?? 0 : null,
          sections: results[3].status === "fulfilled" ? results[3].value?.totalItems ?? 0 : null,
        });
        if (results[4].status === "fulfilled") {
          const semesters = Array.isArray(results[4].value) ? results[4].value : [];
          setActiveSemester(getActiveSemester(semesters) ?? null);
        }
        setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      ignore = true;
    };
  }, [user?.role]);

  if (user?.role !== "ADMIN") {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user?.fullName ?? "there"}
        </h1>
        <p className="mt-2 text-slate-600">
          Visit the Announcement Center to see the latest updates.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Welcome back, {user?.fullName ?? "Administrator"}
        </h1>
      </div>
      <article className="flex flex-wrap items-center justify-between gap-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
            Current Academic Term
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            {activeSemester?.academicYear?.name ?? "_"}
          </h2>
          <p className="mt-1 text-blue-100">
            {activeSemester?.name ?? "No active semester"}
          </p>
        </div>
        <p className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white">
          {activeSemester?.startDate ?? "_"} — {activeSemester?.endDate ?? "_"}
        </p>
      </article>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.map(({ key, label, icon: Icon, color }) => (
          <article key={key} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "…" : counts[key] ?? "_"}
                </p>
              </div>
              <span className={`rounded-lg p-2.5 ${color}`}><Icon size={21} /></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
