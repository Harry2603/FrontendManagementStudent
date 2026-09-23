import { lazy } from "react";
import { Home, Users, Settings, User } from "lucide-react";
import { ROLES } from "@/config/constants";

// Lazy load: mỗi page thành 1 chunk riêng
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const UsersPage = lazy(() => import("@/pages/Users"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AccountsPage = lazy(() => import("@/pages/Accounts"));

export const routeConfig = [
  { path: "/login", Component: Login, access: "guest" },

  { path: "/admin/login", Component: Login, access: "guest" },

  { path: "/register", Component: Register, access: "guest" },

  {
    path: "/",
    Component: HomePage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER],
    menu: {
      label: "Trang chủ",
      icon: Home,
      end: true,
    },
  },

  {
    path: "/profile",
    Component: ProfilePage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    menu: {
      label: "Profile",
      icon: User,
    },
  },

  {
    path: "/users",
    Component: UsersPage,
    access: "private",
    roles: [ROLES.ADMIN],
    menu: {
      label: "Users",
      icon: Users,
    },
  },
  {
    path: "/accounts",
    Component: AccountsPage,
    access: "private",
    roles: [ROLES.ADMIN, ROLES.TEACHER],
    menu: {
      label: "Accounts",
      icon: Users,
    },
  },
  {
    path: "/settings",
    Component: SettingsPage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    menu: {
      label: "Settings",
      icon: Settings,
    },
  },

  {
    path: "*",
    Component: NotFound,
    access: "public",
  },
];
