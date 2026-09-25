import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
  const searchQuery = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchQuery);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSeeTeacherTab = role === "ADMIN";
  const requestedTab = searchParams.get("role");
  const activeTab =
    requestedTab === "TEACHER" && canSeeTeacherTab ? "TEACHER" : "STUDENT";
  const pageNumber = getPageFromParams(searchParams.get("page"));

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

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
      .getAllUsers({
        search: searchQuery,
        role: activeTab,
        pageNumber,
        pageSize: PAGE_SIZE,
      })
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
  }, [activeTab, pageNumber, searchQuery]);

  const handleTabChange = (nextTab) => {
    updateQueryParams({ role: nextTab, page: 1 });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateQueryParams({ search: search.trim(), page: 1 });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">
        Account Management
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RoleTabs
          value={activeTab}
          onChange={handleTabChange}
          canSeeTeacherTab={canSeeTeacherTab}
        />

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-md"
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <Table columns={COLUMNS} data={users} rowKey={(row) => row.id} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-3 text-sm">
          <button
            type="button"
            onClick={() => updateQueryParams({ page: pageNumber - 1 })}
            disabled={pageNumber <= 1 || loading}
            className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-slate-500">
            Page {pageNumber} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => updateQueryParams({ page: pageNumber + 1 })}
            disabled={pageNumber >= totalPages || loading}
            className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
