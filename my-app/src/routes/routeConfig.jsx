import {
  Bell,
  BookPlus,
  Home,
  Users,
  Settings,
  User,
  GraduationCap,
} from "lucide-react";
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
  TranscriptPage,
  CourseManagementPage,
  AnnouncementCenterPage,
  TeacherCourseSectionPage,
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
      label: "Home",
      icon: Home,
      end: true,
    },
  },

  {
    path: "/users",
    Component: UsersPage,
    access: "private",
    roles: [ROLES.ADMIN],
    menu: {
      label: "Create Teacher",
      icon: Users,
    },
  },
  {
    path: "/accounts",
    Component: AccountsPage,
    access: "private",
    roles: [ROLES.ADMIN, ROLES.TEACHER],
    menu: {
      label: "Account Management",
      icon: Users,
    },
  },
  {
    path: "/enrollment",
    Component: EnrollmentPage,
    access: "private",
    roles: [ROLES.STUDENT],
    menu: { label: "Enrollment", icon: Settings },
  },
  {
    path: "/transcript",
    Component: TranscriptPage,
    access: "private",
    roles: [ROLES.STUDENT],
    menu: { label: "Bảng điểm", icon: GraduationCap },
  },
  {
    path: "/course-management",
    Component: CourseManagementPage,
    access: "private",
    roles: [ROLES.ADMIN],
    menu: {
      label: "Course Management",
      icon: BookPlus,
    },
  },
  {
    path: "/teacher-course-sections",
    Component: TeacherCourseSectionPage,
    access: "private",
    roles: [ROLES.TEACHER],
    menu: {
      label: "Course Sections",
      icon: BookPlus,
    },
  },
  {
    path: "/announcements",
    Component: AnnouncementCenterPage,
    access: "private",
    roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    menu: {
      label: "Announcement Center",
      icon: Bell,
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
