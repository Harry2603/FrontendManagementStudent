// src/App.jsx
import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";
import Layout from "@/layouts/Layout";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { routeConfig } from "@/routes/routeConfig";

// Tách nhóm 1 lần ở module scope, không lọc lại mỗi lần render
const guestRoutes = routeConfig.filter((r) => r.access === "guest");
const privateRoutes = routeConfig.filter((r) => r.access === "private");
const publicRoutes = routeConfig.filter((r) => r.access === "public");

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Chưa đăng nhập: Login, Register (không có Layout) */}
        <Route element={<GuestRoute />}>
          {guestRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Route>

        {/* Đã đăng nhập: bọc Layout, rồi kiểm tra role từng route */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {privateRoutes.map(({ path, Component, roles }) => (
              <Route key={path} element={<ProtectedRoute roles={roles} />}>
                <Route path={path} element={<Component />} />
              </Route>
            ))}
          </Route>
        </Route>

        {publicRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Suspense>
  );
}
