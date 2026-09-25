import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Table from "@/components/ui/Table/Table";
import RoleTabs from "@/features/users/components/RoleTabs";
import { buildAccountColumns } from "@/features/users/utils/accountColumns";
import { userService } from "@/features/users/services/useService";
import { useAuth } from "@/features/auth/hooks/useAuth";

const COLUMNS = buildAccountColumns();
const PAGE_SIZE = 10;

function getPageFromParams(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function Accounts() {
  const { user } = useAuth();
  const role = user?.role; // "ADMIN" | "TEACHER"
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeTeacherTab = role === "ADMIN";
  const requestedTab = searchParams.get("role");
  const activeTab =
    requestedTab === "TEACHER" && canSeeTeacherTab ? "TEACHER" : "STUDENT";
  const pageNumber = getPageFromParams(searchParams.get("page"));

  const updateQueryParams = useCallback(
    (updates) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        nextParams.set(key, String(value));
      });
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!canSeeTeacherTab && requestedTab === "TEACHER") {
      updateQueryParams({ role: "STUDENT", page: 1 });
    }
  }, [canSeeTeacherTab, requestedTab, updateQueryParams]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError("");

    userService
      .getAllUsers({ role: activeTab, pageNumber, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!ignore) {
          setUsers(res.items ?? []);
          setTotalPages(res.totalPages ?? 1);
        }
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
  }, [activeTab, pageNumber]);

  const handleTabChange = (nextTab) => {
    updateQueryParams({ role: nextTab, page: 1 });
  };

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((u) => {
      if (u.role !== activeTab) return false;
      if (!keyword) return true;

      const fullName = String(u.fullName ?? "").toLowerCase();
      const email = String(u.email ?? "").toLowerCase();
      return fullName.includes(keyword) || email.includes(keyword);
    });
  }, [users, activeTab, search]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">
        Account Management
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
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => updateQueryParams({ page: pageNumber - 1 })}
            disabled={pageNumber <= 1 || loading}
            className="cursor-pointer rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-gray-500">
            Trang {pageNumber}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => updateQueryParams({ page: pageNumber + 1 })}
            disabled={pageNumber >= totalPages || loading}
            className="cursor-pointer rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
