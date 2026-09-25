import { useCallback, useEffect, useMemo, useState } from "react";
import { authStorage } from "@/utils/authStorage";
import { setUnauthorizedHandler } from "@/services/axiosClient";
import { AuthContext } from "./AuthContextValue";

// Chạy 1 lần lúc mount: khôi phục phiên nếu token còn hạn.
const restoreUser = () => {
  const session = authStorage.get();
  if (!session || authStorage.isExpired(session)) {
    authStorage.clear();
    return null;
  }
  return session.user;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(restoreUser); // truyền hàm, không gọi: lazy initializer

  // session = response của login / register / admin login
  const setSession = useCallback((session) => {
    authStorage.set(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    const session = authStorage.get();
    if (session) authStorage.set({ ...session, user: nextUser });
    setUser(nextUser);
  }, []);

  // Axios gặp 401 (token hết hạn) thì gọi logout.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(() => {});
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, setSession, updateUser, logout }),
    [user, setSession, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
