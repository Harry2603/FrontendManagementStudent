import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authStorage } from "@/utils/authStorage";
import { setUnauthorizedHandler } from "@/services/axiosClient";

export const AuthContext = createContext(null);

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

  // Axios gặp 401 (token hết hạn) thì gọi logout.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(() => {});
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, setSession, logout }),
    [user, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
