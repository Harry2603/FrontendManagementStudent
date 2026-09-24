import { lazy } from "react";

export const Login = lazy(() => import("@/pages/Login"));
export const Register = lazy(() => import("@/pages/Register"));
export const HomePage = lazy(() => import("@/pages/HomePage"));
export const ProfilePage = lazy(() => import("@/pages/Profile"));
export const UsersPage = lazy(() => import("@/pages/Users"));
export const SettingsPage = lazy(() => import("@/pages/Settings"));
export const NotFound = lazy(() => import("@/pages/NotFound"));
export const AccountsPage = lazy(() => import("@/pages/Accounts"));
export const EnrollmentPage = lazy(() => import("@/pages/Enrollment"));
export const TranscriptPage = lazy(() => import("@/pages/Transcript"));
export const CourseManagementPage = lazy(
  () => import("@/pages/CourseManagement"),
);
export const AnnouncementCenterPage = lazy(
  () => import("@/pages/AnnouncementCenter"),
);
export const TeacherCourseSectionPage = lazy(
  () => import("@/pages/TeacherCourseSection"),
);
