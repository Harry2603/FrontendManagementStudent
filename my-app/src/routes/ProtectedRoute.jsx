import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";

// Chỉ cho người ĐÃ đăng nhập (và đúng role nếu có `roles`)
export function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Lưu nơi đang định vào, để Login quay lại đúng chỗ sau khi đăng nhập
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// Chỉ cho người CHƯA đăng nhập (login, register)
export function GuestRoute() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
