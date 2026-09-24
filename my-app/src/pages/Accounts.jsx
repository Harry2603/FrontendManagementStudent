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
const PAGE_SIZE = 10;

export default function Accounts() {
  const { user } = useAuth();
  const role = user?.role; // "ADMIN" | "TEACHER"

  const [tab, setTab] = useState("STUDENT");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("ALL");
  const [sectionOptions, setSectionOptions] = useState([]);

  const [users, setUsers] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeTeacherTab = role === "ADMIN";
  const activeTab = canSeeTeacherTab || tab !== "TEACHER" ? tab : "STUDENT";

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setPageNumber(1);
  };

  // Load users theo role và trang hiện tại; search/sort xử lý client-side.
  useEffect(() => {
    let ignore = false;

    queueMicrotask(() => {
      if (ignore) return;
      setLoading(true);
      setError("");

      userService
        .getAllUsers({ role: activeTab, pageNumber, pageSize: PAGE_SIZE })
        .then((res) => {
          if (!ignore) {
            setUsers(res.items ?? []);
            setPageNumber(res.pageNumber ?? pageNumber);
            setTotalPages(res.totalPages ?? 1);
          }
        })
        .catch(() => {
          if (!ignore) setError("Không tải được danh sách user.");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    });

    return () => {
      ignore = true;
    };
  }, [activeTab, pageNumber]);

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
      if (u.role !== activeTab) return false;
      if (!keyword) return true;
      return (
        u.fullName.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
      );
    });
  }, [users, activeTab, search]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">
        Quản lý tài khoản
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleTabs
          value={activeTab}
          onChange={handleTabChange}
          canSeeTeacherTab={canSeeTeacherTab}
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <Table
          columns={COLUMNS}
          data={filteredUsers}
          rowKey={(row) => row.id}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setPageNumber((page) => page - 1)}
            disabled={pageNumber <= 1 || loading}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-gray-500">
            Trang {pageNumber}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((page) => page + 1)}
            disabled={pageNumber >= totalPages || loading}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
