import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Users,
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

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US").format(new Date(date));
};

const formatSchedule = (section) =>
  `${dayLabels[section.dayOfWeek] ?? section.dayOfWeek ?? "-"}, ${section.startPeriod ?? "-"} - ${section.endPeriod ?? "-"}`;

const formatError = (error, fallback) =>
  error.response?.data?.message ?? error.response?.data?.title ?? fallback;

const defaultScoreComponents = [
  { componentId: "default-attendance", componentName: "Attendance", weight: 0 },
  { componentId: "default-midterm", componentName: "Midterm", weight: 0 },
  { componentId: "default-final", componentName: "Final", weight: 0 },
  { componentId: "default-lab", componentName: "Lab", weight: 0 },
];

function getScoreMap(scores = []) {
  return Object.fromEntries(
    scores.map((score) => [score.componentId, score.scoreValue]),
  );
}

function getWeightedTotal(scores = []) {
  const scoredItems = scores.filter(
    (score) => score.scoreValue !== null && score.scoreValue !== undefined,
  );
  const totalWeight = scoredItems.reduce(
    (total, score) => total + Number(score.weight || 0),
    0,
  );
  if (!scoredItems.length || !totalWeight) return "-";
  const total =
    scoredItems.reduce(
      (sum, score) =>
        sum + Number(score.scoreValue) * Number(score.weight || 0),
      0,
    ) / totalWeight;
  return Number(total.toFixed(2));
}

function ScoreCell({ value, onChange }) {
  return (
    <input
      type="number"
      min="1"
      max="100"
      step="1"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-20 rounded-md border border-blue-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-200"
    />
  );
}

export default function TeacherCourseSection() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [draftScores, setDraftScores] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingWeightsSection, setEditingWeightsSection] = useState(null);
  const [gradeComponents, setGradeComponents] = useState([]);
  const [weightDrafts, setWeightDrafts] = useState({});
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightError, setWeightError] = useState("");
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [scoreError, setScoreError] = useState("");
  const [finalizingGrades, setFinalizingGrades] = useState(false);
  const [sectionSearchInput, setSectionSearchInput] = useState("");
  const [sectionCodeSearch, setSectionCodeSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setLoadingSections(true);
    setError("");
    courseSectionService
      .getTeacherSections({
        sectionCode: sectionCodeSearch,
        pageNumber,
        pageSize,
      })
      .then((response) => {
        if (!active) return;
        setSections(response?.items ?? []);
        const nextTotalPages = Math.max(response?.totalPages ?? 1, 1);
        setTotalPages(nextTotalPages);
        if (pageNumber > nextTotalPages) setPageNumber(nextTotalPages);
      })
      .catch((requestError) => {
        if (active)
          setError(
            formatError(requestError, "Unable to load course sections."),
          );
      })
      .finally(() => {
        if (active) setLoadingSections(false);
      });

    return () => {
      active = false;
    };
  }, [sectionCodeSearch, pageNumber]);

  const openSection = (section) => {
    setSelectedSection(section);
    setSectionDetail(null);
    setStudents([]);
    setError("");
  };

  const searchSections = (event) => {
    event.preventDefault();
    setPageNumber(1);
    setSectionCodeSearch(sectionSearchInput.trim());
  };

  useEffect(() => {
    if (!selectedSection) return undefined;
    let active = true;
    setLoadingDetail(true);
    courseSectionService
      .getTeacherSectionDetail(selectedSection.id)
      .then((response) => {
        if (!active) return;
        setSectionDetail(response);
        setStudents(response?.students?.items ?? []);
      })
      .catch((requestError) => {
        if (active)
          setError(
            formatError(
              requestError,
              "Unable to load the students in this course section.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSection]);

  const scoreComponents = useMemo(() => {
    const components = new Map();
    students.forEach((student) => {
      (student.scores ?? []).forEach((score) => {
        if (!components.has(score.componentId))
          components.set(score.componentId, score);
      });
    });
    const actualComponents = [...components.values()];
    const hasLab = actualComponents.some((component) =>
      component.componentName?.toLowerCase().includes("lab"),
    );
    if (!hasLab) {
      if (actualComponents.length >= 4)
        actualComponents[3] = defaultScoreComponents[3];
      else actualComponents.push(defaultScoreComponents[3]);
    }
    return [...actualComponents, ...defaultScoreComponents]
      .filter(
        (component, index, all) =>
          all.findIndex(
            (item) => item.componentId === component.componentId,
          ) === index,
      )
      .slice(0, 4);
  }, [students]);

  const updateDraftScore = (studentId, componentId, value) => {
    setDraftScores((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? {}), [componentId]: value },
    }));
  };

  const finalizeGrades = async () => {
    if (!selectedSection || finalizingGrades) return;

    setFinalizingGrades(true);
    setError("");
    try {
      await courseSectionService.finalizeGrades(selectedSection.id);
      const response = await courseSectionService.getTeacherSectionDetail(
        selectedSection.id,
      );
      setSectionDetail(response);
      setStudents(response?.students?.items ?? []);
    } catch (requestError) {
      setError(formatError(requestError, "Unable to finalize grades."));
    } finally {
      setFinalizingGrades(false);
    }
  };

  const openStudentEditor = (student) => {
    setScoreError("");
    setEditingStudent(student);
    setDraftScores((current) => ({
      ...current,
      [student.studentUserRoleId]: Object.fromEntries(
        (student.scores ?? []).map((score) => [
          score.componentId,
          score.scoreValue ?? "",
        ]),
      ),
    }));
  };

  const closeStudentEditor = () => {
    if (savingStudentId === editingStudent?.studentUserRoleId) return;
    setEditingStudent(null);
    setScoreError("");
  };

  const saveScores = async (student) => {
    const studentDraftScores = {
      ...getScoreMap(student.scores),
      ...(draftScores[student.studentUserRoleId] ?? {}),
    };
    const hasInvalidScore = Object.values(studentDraftScores).some(
      (value) =>
        value !== "" &&
        value !== undefined &&
        value !== null &&
        (Number.isNaN(Number(value)) ||
          Number(value) < 1 ||
          Number(value) > 100),
    );
    if (hasInvalidScore) {
      setScoreError("Scores must be between 1 and 100.");
      return;
    }

    setSavingStudentId(student.studentUserRoleId);
    setScoreError("");
    try {
      const scoreRequests = (student.scores ?? []).map((score) => {
        const scoreValue = studentDraftScores[score.componentId];
        const studentScoreId =
          score.scoreId ?? score.studentScoreId ?? score.id;
        if (!studentScoreId) {
          throw new Error(
            `Missing studentScoreId for component ${score.componentId}.`,
          );
        }
        return {
          componentId: score.componentId,
          request: courseSectionService.updateStudentScore(
            studentScoreId,
            scoreValue === "" || scoreValue === undefined
              ? null
              : Number(scoreValue),
          ),
        };
      });
      const responses = await Promise.all(
        scoreRequests.map(({ request }) => request),
      );
      console.log("[TeacherCourseSection] save score responses", {
        studentId: student.studentUserRoleId,
        responses,
      });
      const responseByComponent = new Map(
        scoreRequests.map(({ componentId }, index) => [
          componentId,
          responses[index],
        ]),
      );

      setStudents((current) =>
        current.map((currentStudent) => {
          if (currentStudent.studentUserRoleId !== student.studentUserRoleId)
            return currentStudent;
          return {
            ...currentStudent,
            scores: (currentStudent.scores ?? []).map((score) => {
              const response = responseByComponent.get(score.componentId);
              return response
                ? { ...score, scoreValue: response.score }
                : score;
            }),
          };
        }),
      );
      setEditingStudent(null);
    } catch (requestError) {
      setScoreError(
        formatError(requestError, "Unable to save the student scores."),
      );
    } finally {
      setSavingStudentId(null);
    }
  };

  const openWeightEditor = async (event, section) => {
    event.stopPropagation();
    setEditingWeightsSection(section);
    setGradeComponents([]);
    setWeightDrafts({});
    setWeightError("");
    setLoadingWeights(true);
    try {
      const response = await courseSectionService.getGradeComponents(
        section.id,
      );
      const components = Array.isArray(response)
        ? response
        : (response?.components ?? []);
      setGradeComponents(components);
      setWeightDrafts(
        Object.fromEntries(
          components.map((component) => [
            component.gradeComponentId ?? component.id,
            component.weight,
          ]),
        ),
      );
    } catch (requestError) {
      setWeightError(
        formatError(requestError, "Unable to load the course section weights."),
      );
    } finally {
      setLoadingWeights(false);
    }
  };

  const closeWeightEditor = () => {
    setEditingWeightsSection(null);
    setWeightError("");
  };

  const saveWeights = async () => {
    const weights = gradeComponents.map((component) =>
      Number(weightDrafts[component.gradeComponentId ?? component.id]),
    );
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    if (gradeComponents.length !== 4) {
      setWeightError(
        "Each course section must have exactly 4 grade components.",
      );
      return;
    }
    if (
      weights.some(
        (weight) => Number.isNaN(weight) || weight < 0 || weight > 100,
      )
    ) {
      setWeightError("Weights must be between 0 and 100.");
      return;
    }
    if (totalWeight !== 100) {
      setWeightError(
        `The current total weight is ${totalWeight}%. The total must equal 100%.`,
      );
      return;
    }

    setSavingWeights(true);
    setWeightError("");
    try {
      const payload = {
        components: gradeComponents.map((component) => ({
          gradeComponentId: component.gradeComponentId ?? component.id,
          weight: Number(
            weightDrafts[component.gradeComponentId ?? component.id],
          ),
        })),
      };
      await courseSectionService.updateGradeComponents(
        editingWeightsSection.id,
        payload,
      );
      setStudents((current) =>
        current.map((student) => ({
          ...student,
          scores: (student.scores ?? []).map((score) => {
            const component = gradeComponents.find(
              (item) =>
                (item.gradeComponentId ?? item.id) === score.componentId,
            );
            return component
              ? {
                  ...score,
                  weight: Number(
                    weightDrafts[component.gradeComponentId ?? component.id],
                  ),
                }
              : score;
          }),
        })),
      );
      closeWeightEditor();
    } catch (requestError) {
      setWeightError(
        formatError(requestError, "Unable to save the course section weights."),
      );
    } finally {
      setSavingWeights(false);
    }
  };

  const studentColumns = [
    { key: "studentUserRoleId", header: "Student ID", sortable: true },
    {
      key: "fullName",
      header: "Student",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    ...scoreComponents.map((component) => ({
      key: `score-${component.componentId}`,
      header: `${component.componentName} (${component.weight}%)`,
      render: (row) => {
        const score = row.scores?.find(
          (item) => item.componentId === component.componentId,
        );
        return (
          <span className="font-medium text-slate-700">
            {score?.scoreValue ?? "-"}
          </span>
        );
      },
    })),
    {
      key: "total",
      header: "Calculated Total",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {getWeightedTotal(row.scores)}
        </span>
      ),
    },
    {
      key: "finalScore",
      header: "Final Score",
      render: (row) => (
        <span className="font-semibold text-blue-600">
          {row.finalResult?.finalScore ?? "-"}
        </span>
      ),
    },
    {
      key: "letterGrade",
      header: "Letter Grade",
      render: (row) => row.finalResult?.letterGrade ?? "-",
    },
    {
      key: "gradePoint",
      header: "Grade Point",
      render: (row) => row.finalResult?.gradePoint ?? "-",
    },
    {
      key: "resultStatus",
      header: "Result Status",
      render: (row) => row.finalResult?.resultStatus ?? "-",
    },
  ];

  if (loadingSections) return <PageLoader />;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Teacher area</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          My course sections
        </h1>
        <p className="mt-2 text-slate-600">
          Select a course section to view its students and scores.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {scoreError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {scoreError}
        </div>
      )}

      {!selectedSection ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <BookOpen size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Assigned course sections</h2>
          </div>
          <form onSubmit={searchSections} className="flex gap-2">
            <label className="relative block flex-1">
              <span className="sr-only">Search by section code</span>
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={sectionSearchInput}
                onChange={(event) => setSectionSearchInput(event.target.value)}
                placeholder="Search by section code..."
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Search size={16} />
              Search
            </button>
          </form>
          <Table
            columns={[
              { key: "sectionCode", header: "Section code", sortable: true },
              {
                key: "Course",
                header: "Course Name",
                sortable: true,
                render: (row) => row.course.courseName,
              },
              { key: "semesterId", header: "Semester ID", sortable: true },
              {
                key: "schedule",
                header: "Schedule",
                render: (row) => formatSchedule(row),
              },
              {
                key: "dates",
                header: "Dates",
                render: (row) =>
                  `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
              },
              {
                key: "capacity",
                header: "Capacity",
                sortable: true,
                render: (row) => `${row.enrollmentCount}/${row.capacity}`,
              },
              { key: "status", header: "Status", sortable: true },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button
                    type="button"
                    onClick={(event) => openWeightEditor(event, row)}
                    className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={15} />
                    Edit weights
                  </button>
                ),
              },
            ]}
            data={sections}
            rowKey={(row) => row.id}
            onRowClick={openSection}
            emptyMessage="You have no assigned course sections"
          />
          <div className="flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setPageNumber((page) => page - 1)}
              disabled={pageNumber === 1 || loadingSections}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <ChevronLeft size={17} />
              Previous
            </button>
            <span className="text-slate-600">
              Page {pageNumber} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPageNumber((page) => page + 1)}
              disabled={pageNumber >= totalPages || loadingSections}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedSection(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to course sections
          </button>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {sectionDetail?.sectionCode ?? selectedSection.sectionCode}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Course ID:{" "}
                  {sectionDetail?.courseId ?? selectedSection.courseId}
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={16} />
                    {formatSchedule(selectedSection)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={16} />
                    {sectionDetail?.students?.totalItems ??
                      students.length}{" "}
                    students
                  </span>
                  <span>
                    {formatDate(selectedSection.startDate)} -{" "}
                    {formatDate(selectedSection.endDate)}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {selectedSection.status}
              </span>
            </div>
          </div>
          {loadingDetail ? (
            <PageLoader />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 text-slate-900">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold">Students and scores</h2>
                </div>
                <button
                  type="button"
                  onClick={finalizeGrades}
                  disabled={finalizingGrades}
                  className="rounded-md bg-blue-600 px-8 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {finalizingGrades ? "Finalizing..." : "Summary"}
                </button>
              </div>
              <Table
                columns={studentColumns}
                data={students}
                rowKey={(row) => row.studentUserRoleId}
                onRowClick={openStudentEditor}
                emptyMessage="This course section has no students"
              />
            </>
          )}
        </div>
      )}

      {editingStudent && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-score-editor-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {editingStudent.fullName}
                </p>
                <h2
                  id="student-score-editor-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Edit student scores
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingStudent.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStudentEditor}
                disabled={savingStudentId === editingStudent.studentUserRoleId}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {scoreComponents.map((component) => {
                const score = editingStudent.scores?.find(
                  (item) => item.componentId === component.componentId,
                );
                if (!score) return null;
                return (
                  <label
                    key={component.componentId}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <span>
                      <span className="block font-medium text-slate-900">
                        {component.componentName}
                      </span>
                      <span className="text-xs text-slate-500">
                        Weight: {component.weight}%
                      </span>
                    </span>
                    <ScoreCell
                      value={
                        draftScores[editingStudent.studentUserRoleId]?.[
                          component.componentId
                        ] ?? score.scoreValue
                      }
                      onChange={(value) =>
                        updateDraftScore(
                          editingStudent.studentUserRoleId,
                          component.componentId,
                          value,
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>

            {scoreError && (
              <p className="mt-4 text-sm text-red-600">{scoreError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeStudentEditor}
                disabled={savingStudentId === editingStudent.studentUserRoleId}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveScores(editingStudent)}
                disabled={savingStudentId === editingStudent.studentUserRoleId}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStudentId === editingStudent.studentUserRoleId
                  ? "Saving..."
                  : "Save scores"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingWeightsSection && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weight-editor-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {editingWeightsSection.sectionCode}
                </p>
                <h2
                  id="weight-editor-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Edit score weights
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A course section must have exactly 4 components with a total
                  weight of 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={closeWeightEditor}
                disabled={savingWeights}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loadingWeights ? (
              <PageLoader />
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  {gradeComponents.map((component) => {
                    const componentId =
                      component.gradeComponentId ?? component.id;
                    return (
                      <label
                        key={componentId}
                        className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
                      >
                        <span>
                          <span className="block font-medium text-slate-900">
                            {component.name ?? `Component ${componentId}`}
                          </span>
                          <span className="text-xs text-slate-500">
                            Component ID: {componentId}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={weightDrafts[componentId] ?? ""}
                            onChange={(event) =>
                              setWeightDrafts((current) => ({
                                ...current,
                                [componentId]: event.target.value,
                              }))
                            }
                            className="w-24 rounded-md border border-blue-300 px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                          <span className="text-sm text-slate-500">%</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {weightError && (
                  <p className="mt-4 text-sm text-red-600">{weightError}</p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeWeightEditor}
                    disabled={savingWeights}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveWeights}
                    disabled={savingWeights || loadingWeights}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingWeights ? "Saving..." : "Save weights"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
