import { useEffect, useMemo, useState } from "react";
import Table from "@/components/ui/Table/Table";
import RoleTabs from "@/features/users/components/RoleTabs";
import SectionFilter from "@/features/users/components/SectionFilter";
import { buildAccountColumns } from "@/features/users/utils/accountColumns";
import { userService } from "@/features/users/services/useService";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Tạo 1 lần ở module scope vì không phụ thuộc props/state của Accounts
// -> tránh Table nhận "columns" object mới mỗi render (đỡ re-render thừa).
const COLUMNS = buildAccountColumns();

export default function Accounts() {
  const { user } = useAuth();
  const role = user?.role; // "ADMIN" | "TEACHER"

  const [tab, setTab] = useState("STUDENT");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("ALL");
  const [sectionOptions, setSectionOptions] = useState([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeTeacherTab = role === "ADMIN";

  // Teacher không được phép ở tab TEACHER -> ép về STUDENT nếu role thay đổi
  useEffect(() => {
    if (!canSeeTeacherTab && tab === "TEACHER") setTab("STUDENT");
  }, [canSeeTeacherTab, tab]);

  // Load toàn bộ user 1 lần, search/sort xử lý client-side (đã chốt)
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    userService
      .getAllUsers()
      .then((res) => {
        if (!ignore) setUsers(res.items ?? []);
      })
      .catch(() => {
        if (!ignore) setError("Unable to load the user list.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Section dropdown: chỉ Teacher có data thật (API đã có).
  // Admin: chờ API riêng -> giữ nguyên "Tất cả section" (xem SectionFilter.jsx).
  useEffect(() => {
    if (role !== "TEACHER") return;

    let ignore = false;
    courseSectionService
      .getMySections()
      .then((res) => {
        if (ignore) return;
        const codes = (res.items ?? []).map((s) => s.sectionCode);
        setSectionOptions(Array.from(new Set(codes)));
      })
      .catch(() => {
        if (!ignore) setSectionOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [role]);

  // Lọc theo tab (role) + search. CHƯA lọc theo `section` (đã chốt: để sau).
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((u) => {
      if (u.role !== tab) return false;
      if (!keyword) return true;
      return (
        u.fullName.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
      );
    });
  }, [users, tab, search]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">
        Account Management
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleTabs
          value={tab}
          onChange={setTab}
          canSeeTeacherTab={canSeeTeacherTab}
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />

          {tab === "STUDENT" && (
            <SectionFilter
              value={section}
              onChange={setSection}
              options={sectionOptions}
              disabled={role === "ADMIN"}
            />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <Table
          columns={COLUMNS}
          data={filteredUsers}
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
