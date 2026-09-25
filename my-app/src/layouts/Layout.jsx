import { memo, Suspense, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { routeConfig } from "@/routes/routeConfig";
import { authService, useAuth } from "@/features/auth";
import PageLoader from "@/components/common/PageLoader";
import { getAvatarSrc, useDefaultAvatarOnError } from "@/utils/avatar";
import defaultAvatar from "@/assets/defaultAvatar.png";

const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  }`;

// Sidebar chỉ render lại khi `role` đổi (đăng nhập/đăng xuất), không phụ thuộc nội dung page
const Sidebar = memo(function Sidebar({ role, isOpen, onToggle }) {
  const menuItems = routeConfig.filter(
    (r) => r.menu && (!r.roles || r.roles.includes(role)),
  );
  const desktopWidthClass = isOpen ? "lg:w-64" : "lg:w-20";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-64 lg:static lg:translate-x-0 lg:shadow-none ${desktopWidthClass}`}
    >
      <div
        className={`flex h-16 items-center ${
          isOpen ? "justify-between px-3" : "justify-center"
        }`}
      >
        {isOpen && (
          <div
            aria-label="MsSystem"
            className="flex h-10 w-44 items-center justify-start text-lg font-bold text-blue-600"
          >
            MsSystem
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map(({ path, menu: { label, icon: Icon, end } }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            title={!isOpen ? label : undefined}
            className={({ isActive }) =>
              `${getLinkClass({ isActive })} ${!isOpen ? "justify-center px-2" : ""}`
            }
          >
            <Icon size={18} />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
});

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const displayName = user?.fullName ?? "User";

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  useEffect(() => {
    let ignore = false;

    authService
      .getMe()
      .then((profile) => {
        if (!ignore) setAvatarUrl(profile?.avatarUrl ?? null);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100"
      >
        <img
          src={getAvatarSrc(avatarUrl)}
          alt=""
          onError={useDefaultAvatarOnError}
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold text-slate-800">
            {displayName}
          </span>
          <span className="block text-xs text-slate-500">{user?.role}</span>
        </span>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleChange = (event) => {
      setIsSidebarOpen(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        role={user.role}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              onClick={() => setIsSidebarOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
            <img
              src={defaultAvatar}
              alt="Logo"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            />
          </div>
          <UserMenu user={user} onLogout={logout} />
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
