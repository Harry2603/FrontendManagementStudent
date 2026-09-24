import { Home, Users, Settings, User } from "lucide-react";
import { ROLES } from "@/config/constants";
import {
  Login,
  Register,
  HomePage,
  ProfilePage,
  UsersPage,
  SettingsPage,
  NotFound,
  AccountsPage,
  EnrollmentPage,
} from "./pageComponents";

export const routeConfig = [
  { path: "/login", Component: Login, access: "guest" },

  { path: "/admin/login", Component: Login, access: "guest" },

  { path: "/register", Component: Register, access: "guest" },

  {
    path: "/",
    Component: HomePage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
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
    path: "/enrollment",
    Component: EnrollmentPage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER],
    menu: { label: "Enrollment", icon: Settings },
  },

  {
    path: "*",
    Component: NotFound,
    access: "public",
  },
];
