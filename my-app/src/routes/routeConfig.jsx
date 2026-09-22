import { lazy } from "react";
import { Home, Users, Settings } from "lucide-react";
import { ROLES } from "@/config/constants";

// Lazy load: mỗi page thành 1 chunk riêng
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const HomePage = lazy(() => import("@/pages/HomePage"));
// const Dashboard = lazy(() => import("@/pages/Dashboard"));
const UsersPage = lazy(() => import("@/pages/Users"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const routeConfig = [
  { path: "/login", Component: Login, access: "guest" },
  { path: "/admin/login", Component: Login, access: "guest" },
  { path: "/register", Component: Register, access: "guest" },
  {
    path: "/",
    Component: HomePage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER],
    menu: { label: "Trang chủ", icon: Home, end: true },
  },
  // {
  //   path: "/dashboard",
  //   label: "Dashboard",
  //   access: "private",
  //   icon: LayoutDashboard,
  //   Component: Dashboard,
  //   end: true,
  // },
  {
    path: "/users",
    access: "private",
    roles: [ROLES.ADMIN],
    menu: { label: "Users", icon: Users },
    Component: UsersPage,
  },
  {
    path: "/settings",
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    menu: { label: "Settings", icon: Settings },
    Component: SettingsPage,
  },
  { path: "*", Component: NotFound, access: "public" },
];
