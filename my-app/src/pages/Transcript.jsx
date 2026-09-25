import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, CircleAlert, GraduationCap } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { transcriptService } from "@/features/transcript/services/transcriptService";

const formatScore = (score) =>
  Number.isFinite(Number(score)) ? Number(score).toFixed(2) : "_";

const formatTenPointScore = (score) =>
  Number.isFinite(Number(score)) ? Number(score).toFixed(2) : "_";

const formatCredits = (credits) =>
  Number.isFinite(Number(credits)) ? Number(credits) : "_";

const SCORE_COLUMNS = [
  { key: "attendance", label: "Attendance", terms: ["attendance", "chuyên cần"] },
  { key: "midterm", label: "Midterm", terms: ["midterm", "giữa kỳ"] },
  { key: "lab", label: "Lab", terms: ["lab", "thực hành"] },
  { key: "final", label: "Final", terms: ["final", "cuối kỳ"] },
];

const getComponent = (componentScores, terms) =>
  componentScores?.find((item) => {
    const name = String(item.componentName ?? "").toLowerCase();
    return terms.some((term) => name.includes(term));
  });

const getComponentScore = (componentScores, terms) =>
  formatTenPointScore(getComponent(componentScores, terms)?.score);

const resultStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "PASS":
      return "bg-emerald-50 text-emerald-700";
    case "FAIL":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

function groupByAcademicYear(items) {
  const years = new Map();

  items.forEach((item) => {
    const yearId = item.academicYearId ?? "unknown";
    const year = years.get(yearId) ?? {
      id: yearId,
      name: item.academicYearName ?? "Unknown academic year",
      semesters: new Map(),
    };
    const semesterId = item.semesterId ?? "unknown";
    const semester = year.semesters.get(semesterId) ?? {
      id: semesterId,
      name: item.semesterName ?? "Unknown semester",
      items: [],
    };

    semester.items.push(item);
    year.semesters.set(semesterId, semester);
    years.set(yearId, year);
  });

  return [...years.values()]
    .sort((a, b) => String(b.name).localeCompare(String(a.name), "vi"))
    .map((year) => ({
      ...year,
      semesters: [...year.semesters.values()].sort((a, b) =>
        String(a.id).localeCompare(String(b.id), "vi", { numeric: true }),
      ),
    }));
}

function getGpaSemester(gpaYears, year, semester) {
  const gpaYear = getGpaYear(gpaYears, year);

  return gpaYear?.semesters?.find(
    (item) =>
      item.semesterId === semester.id || item.semesterName === semester.name,
  );
}

function getGpaYear(gpaYears, year) {
  return gpaYears.find(
    (item) =>
      item.academicYearId === year.id || item.academicYearName === year.name,
  );
}

function ResultStatus({ result }) {
  const status = result?.resultStatus;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${resultStyle(status)}`}
    >
      {status?.toUpperCase() === "PASS" ? (
        <CheckCircle2 size={14} />
      ) : status?.toUpperCase() === "FAIL" ? (
        <CircleAlert size={14} />
      ) : null}
      {status ?? "No result yet"}
    </span>
  );
}

export default function Transcript() {
  const [items, setItems] = useState([]);
  const [gpaYears, setGpaYears] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [gpaError, setGpaError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchTranscript() {
      setPageLoading(true);
      setPageError("");
      setGpaError("");

      try {
        const [transcriptResult, gpaResult] = await Promise.allSettled([
          (async () => {
            const firstPage = await transcriptService.getCourseResults();
            const totalPages = firstPage?.totalPages ?? 1;
            const remainingPages = await Promise.all(
              Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
                transcriptService.getCourseResults({ pageNumber: index + 2 }),
              ),
            );
            return [firstPage, ...remainingPages].flatMap(
              (page) => page?.items ?? [],
            );
          })(),
          transcriptService.getGpa(),
        ]);

        if (ignore) return;

        if (transcriptResult.status === "fulfilled") {
          setItems(transcriptResult.value);
        } else {
          setPageError(
            transcriptResult.reason?.response?.data?.message ||
              "Unable to load your transcript. Please try again.",
          );
        }

        if (gpaResult.status === "fulfilled") {
          setGpaYears(gpaResult.value?.academicYears ?? []);
        } else {
          setGpaError(
            gpaResult.reason?.response?.data?.message ||
              "Unable to load GPA information.",
          );
        }
      } finally {
        if (!ignore) setPageLoading(false);
      }
    }

    fetchTranscript();
    return () => {
      ignore = true;
    };
  }, []);

  const academicYears = useMemo(() => groupByAcademicYear(items), [items]);
  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
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
          Academic
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Transcript</h1>
        <p className="mt-2 text-slate-600">
          Review your course results by academic year.
        </p>
      </div>

      {gpaError ? (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {gpaError}
        </p>
      ) : null}

      {academicYears.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
          <BookOpenCheck className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-3 font-semibold text-slate-900">No course results yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your transcript will appear once results are published.
          </p>
        </div>
      ) : (
        academicYears.map((year) => (
          <section
            key={year.id}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <GraduationCap size={20} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">{year.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {year.semesters.reduce(
                      (total, semester) => total + semester.items.length,
                      0,
                    )} courses
                  </p>
                </div>
              </div>
              {(() => {
                const gpaYear = getGpaYear(gpaYears, year);

                return gpaYear ? (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">
                      Cumulative GPA: <strong className="text-blue-600">{formatScore(gpaYear.cumulativeGpa)}</strong>
                    </span>
                    <span className="text-slate-500">
                      Cumulative credits: <strong className="text-slate-700">{formatCredits(gpaYear.cumulativeCompletedCredits)}</strong>
                    </span>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="divide-y divide-slate-200">
              {year.semesters.map((semester) => (
                <div key={semester.id} className="p-5">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    {semester.name}
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[1100px] text-left">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Course</th>
                          <th className="px-4 py-3 text-center">Credits</th>
                          {SCORE_COLUMNS.map((column) => (
                            <th key={column.key} className="px-4 py-3 text-center">
                              {column.label}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center">Final score</th>
                          <th className="px-4 py-3 text-center">Letter grade</th>
                          <th className="px-4 py-3 text-center">GPA</th>
                          <th className="px-4 py-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {semester.items.map((item) => {
                          const result = item.finalResult;

                          return (
                            <tr key={item.enrollmentId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm">
                                <p className="font-semibold text-blue-600">
                                {item.courseCode ?? item.sectionCode ?? "_"}
                                </p>
                                <p className="mt-0.5 text-slate-700">
                                  {item.courseName ?? "_"}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {item.sectionCode ?? "_"}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-slate-700">
                                {item.credits ?? "_"}
                              </td>
                              {SCORE_COLUMNS.map((column) => (
                                (() => {
                                  const component = getComponent(
                                    item.componentScores,
                                    column.terms,
                                  );
                                  const weight = Number(component?.weight);

                                  return (
                                    <td
                                      key={column.key}
                                      title={
                                        Number.isFinite(weight)
                                          ? `${column.label} weight: ${weight}%`
                                          : undefined
                                      }
                                      className="px-4 py-3 text-center text-sm text-slate-700"
                                    >
                                      {getComponentScore(
                                        item.componentScores,
                                        column.terms,
                                      )}
                                    </td>
                                  );
                                })()
                              ))}
                              <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                                {formatTenPointScore(result?.finalScore)}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                                {result?.letterGrade ?? "_"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-slate-700">
                                {formatScore(result?.gradePoint)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <ResultStatus result={result} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const gpaSemester = getGpaSemester(gpaYears, year, semester);

                    return gpaSemester ? (
                      <div className="mt-3 flex flex-wrap justify-end gap-x-5 gap-y-1 text-sm">
                        <span className="text-slate-500">
                          GPA: <strong className="text-blue-600">{formatScore(gpaSemester.gpa)}</strong>
                        </span>
                        <span className="text-slate-500">
                          Completed credits: <strong className="text-slate-700">{formatCredits(gpaSemester.completedCredits)}</strong>
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
