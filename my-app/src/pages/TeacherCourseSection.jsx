import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Pencil, Users } from "lucide-react";
import { Table } from "@/components/ui/Table";
import PageLoader from "@/components/common/PageLoader";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";

const dayLabels = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(date));
};

const formatSchedule = (section) =>
  `${dayLabels[section.dayOfWeek] ?? section.dayOfWeek ?? "-"}, ${section.startPeriod ?? "-"} - ${section.endPeriod ?? "-"}`;

const formatError = (error, fallback) =>
  error.response?.data?.message ?? error.response?.data?.title ?? fallback;

const defaultScoreComponents = [
  { componentId: "default-attendance", componentName: "Chuyên cần", weight: 0 },
  { componentId: "default-midterm", componentName: "Giữa kỳ", weight: 0 },
  { componentId: "default-final", componentName: "Cuối kỳ", weight: 0 },
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
      className="w-20 rounded-md border border-indigo-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
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

  useEffect(() => {
    let active = true;
    setLoadingSections(true);
    courseSectionService
      .getTeacherSections()
      .then((response) => {
        if (active) setSections(response?.items ?? []);
      })
      .catch((requestError) => {
        if (active)
          setError(
            formatError(requestError, "Không thể tải danh sách lớp học."),
          );
      })
      .finally(() => {
        if (active) setLoadingSections(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openSection = (section) => {
    setSelectedSection(section);
    setSectionDetail(null);
    setStudents([]);
    setError("");
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
              "Không thể tải thông tin sinh viên của lớp.",
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
      setScoreError("Điểm phải nằm trong khoảng từ 1 đến 100.");
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
            `Thiếu studentScoreId cho component ${score.componentId}.`,
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
      setScoreError(formatError(requestError, "Không thể lưu điểm sinh viên."));
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
        formatError(requestError, "Không thể tải trọng số của course section."),
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
      setWeightError("Mỗi course section phải có đúng 4 grade component.");
      return;
    }
    if (
      weights.some(
        (weight) => Number.isNaN(weight) || weight < 0 || weight > 100,
      )
    ) {
      setWeightError("Trọng số phải nằm trong khoảng từ 0 đến 100.");
      return;
    }
    if (totalWeight !== 100) {
      setWeightError(
        `Tổng trọng số hiện tại là ${totalWeight}%. Tổng phải bằng 100%.`,
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
        formatError(requestError, "Không thể lưu trọng số của course section."),
      );
    } finally {
      setSavingWeights(false);
    }
  };

  const studentColumns = [
    { key: "studentUserRoleId", header: "Mã sinh viên", sortable: true },
    {
      key: "fullName",
      header: "Sinh viên",
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
      header: "Tổng kết",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {getWeightedTotal(row.scores)}
        </span>
      ),
    },
  ];

  if (loadingSections) return <PageLoader />;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">
          Khu vực giảng viên
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Lớp học của tôi
        </h1>
        <p className="mt-2 text-slate-600">
          Chọn một course section để xem danh sách sinh viên và điểm.
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
            <BookOpen size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold">
              Course section đang phụ trách
            </h2>
          </div>
          <Table
            columns={[
              { key: "sectionCode", header: "Mã lớp", sortable: true },
              { key: "courseId", header: "Course ID", sortable: true },
              { key: "semesterId", header: "Semester ID", sortable: true },
              {
                key: "schedule",
                header: "Lịch học",
                render: (row) => formatSchedule(row),
              },
              {
                key: "dates",
                header: "Thời gian",
                render: (row) =>
                  `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
              },
              { key: "capacity", header: "Sức chứa", sortable: true },
              { key: "status", header: "Trạng thái", sortable: true },
              {
                key: "actions",
                header: "Thao tác",
                render: (row) => (
                  <button
                    type="button"
                    onClick={(event) => openWeightEditor(event, row)}
                    className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <Pencil size={15} />
                    Sửa trọng số
                  </button>
                ),
              },
            ]}
            data={sections}
            rowKey={(row) => row.id}
            onRowClick={openSection}
            emptyMessage="Bạn chưa được phân công course section nào"
          />
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedSection(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft size={17} />
            Quay lại danh sách lớp
          </button>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
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
                    sinh viên
                  </span>
                  <span>
                    {formatDate(selectedSection.startDate)} -{" "}
                    {formatDate(selectedSection.endDate)}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {selectedSection.status}
              </span>
            </div>
          </div>
          {loadingDetail ? (
            <PageLoader />
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-900">
                <Users size={20} className="text-indigo-600" />
                <h2 className="text-lg font-semibold">
                  Danh sách sinh viên và điểm
                </h2>
              </div>
              <Table
                columns={studentColumns}
                data={students}
                rowKey={(row) => row.studentUserRoleId}
                onRowClick={openStudentEditor}
                emptyMessage="Lớp chưa có sinh viên"
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
                <p className="text-sm font-semibold text-indigo-600">
                  {editingStudent.fullName}
                </p>
                <h2
                  id="student-score-editor-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Sửa điểm sinh viên
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
                aria-label="Đóng"
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
                        Trọng số: {component.weight}%
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
                Hủy
              </button>
              <button
                type="button"
                onClick={() => saveScores(editingStudent)}
                disabled={savingStudentId === editingStudent.studentUserRoleId}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStudentId === editingStudent.studentUserRoleId
                  ? "Đang lưu..."
                  : "Lưu điểm"}
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
                <p className="text-sm font-semibold text-indigo-600">
                  {editingWeightsSection.sectionCode}
                </p>
                <h2
                  id="weight-editor-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Sửa trọng số điểm
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Course section cần đúng 4 component, tổng trọng số bằng 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={closeWeightEditor}
                disabled={savingWeights}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                aria-label="Đóng"
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
                            ID: {componentId}
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
                            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={saveWeights}
                    disabled={savingWeights || loadingWeights}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingWeights ? "Đang lưu..." : "Lưu trọng số"}
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
