import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";
import { validateEmail, validatePassword } from "@/utils/validators";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { getLoginError } from "../utils/authErrors";

const INITIAL_VALUES = { email: "", password: "" };

export default function LoginForm() {
  const { setSession } = useAuth();
  const isAdmin = useLocation().pathname === "/admin/login";

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Người dùng gõ lại thì xóa lỗi của field đó và lỗi chung
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const clientErrors = {
        email: validateEmail(values.email),
        password: validatePassword(values.password),
      };
      if (clientErrors.email || clientErrors.password) {
        setErrors(clientErrors);
        return; // sai định dạng thì không gọi API
      }

      setLoading(true);
      try {
        const login = isAdmin ? authService.adminLogin : authService.login;
        const session = await login({
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        });
        console.log("inf login", session);

        // user đổi -> GuestRoute tự chuyển tới trang home theo role
        setSession(session);
      } catch (error) {
        setErrors(getLoginError(error));
        setLoading(false);
      }
    },
    [values, isAdmin, setSession],
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow"
    >
      <h1 className="text-2xl font-semibold text-gray-900">
        {isAdmin ? "Đăng nhập quản trị" : "Đăng nhập"}
      </h1>

      {errors.form && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={values.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      {!isAdmin && (
        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Đăng ký
          </Link>
        </p>
      )}
    </form>
  );
}
