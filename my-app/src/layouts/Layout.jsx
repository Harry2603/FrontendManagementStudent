import { memo, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { routeConfig } from "@/routes/routeConfig";
import { useAuth } from "@/features/auth";
import PageLoader from "@/components/common/PageLoader";

const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

// Sidebar chỉ render lại khi `role` đổi (đăng nhập/đăng xuất), không phụ thuộc nội dung page
const Sidebar = memo(function Sidebar({ role, onLogout }) {
  const menuItems = routeConfig.filter(
    (r) => r.menu && (!r.roles || r.roles.includes(role)),
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      <div className="flex h-16 items-center px-6 text-lg font-bold text-white">
        My App
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map(({ path, menu: { label, icon: Icon, end } }) => (
          <NavLink key={path} to={path} end={end} className={getLinkClass}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
});

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role={user.role} onLogout={logout} />

      <main className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
