import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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
  const nameQuery = searchParams.get("Name") ?? "";
  const emailQuery = searchParams.get("Email") ?? "";
  const [name, setName] = useState(nameQuery);
  const [email, setEmail] = useState(emailQuery);
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
    setName(nameQuery);
    setEmail(emailQuery);
  }, [nameQuery, emailQuery]);

  const updateQueryParams = useCallback(
    (updates) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
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
        name: nameQuery,
        email: emailQuery,
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
  }, [activeTab, pageNumber, nameQuery, emailQuery]);

  const handleTabChange = (nextTab) => {
    updateQueryParams({ role: nextTab, page: 1 });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateQueryParams({
      Name: name.trim(),
      Email: email.trim(),
      page: 1,
    });
  };

  const clearSearch = () => {
    setName("");
    setEmail("");
    updateQueryParams({ Name: "", Email: "", page: 1 });
  };

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

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search by name</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Name..."
              aria-label="Search by name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-40 rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Search by email</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Email..."
              aria-label="Search by email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-40 rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600"
            />
          </label>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Search size={15} /> Search
          </button>
          {(name || email) && (
            <button type="button" onClick={clearSearch} aria-label="Clear search" className="inline-flex items-center gap-1 rounded px-2 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              <X size={15} /> Clear
            </button>
          )}
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <Table
          columns={COLUMNS}
          data={users}
          rowKey={(row) => row.id}
        />
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
          <span className="text-slate-500">Page {pageNumber} of {totalPages}</span>
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
