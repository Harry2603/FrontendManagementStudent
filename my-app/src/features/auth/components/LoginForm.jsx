import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { validateEmail, validatePassword } from "@/utils/validators";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { getLoginError } from "../utils/authErrors";
import animatedArtwork from "@/assets/svgviewer-output.svg";

const INITIAL_VALUES = { email: "", password: "" };

export default function LoginForm() {
  const { setSession } = useAuth();
  const isAdmin = useLocation().pathname === "/admin/login";
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        });
        // console.log("inf login", session);

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
    <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="order-2 space-y-4 p-6 sm:p-8 md:order-1"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {isAdmin ? "Đăng nhập quản trị" : "Đăng nhập"}
        </h1>

        {errors.form && (
          <p
            role="alert"
            className="rounded bg-red-50 p-3 text-sm text-red-600"
          >
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 flex w-10 item-center justify-center top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
        <button
          type="button"
          onClick={() => navigate(isAdmin ? "/login" : "/admin/login")}
          className="w-full rounded border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        {!isAdmin && (
          <>
            <p className="text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Đăng ký
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Quản trị viên?{" "}
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                Đăng nhập quản trị
              </Link>
            </p>
          </>
        )}

        {isAdmin && (
          <p className="text-center text-sm text-gray-600">
            Người dùng thông thường?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        )}
      </form>
      <div
        className="order-1 min-h-56 overflow-hidden border-b border-slate-200 bg-slate-50 md:order-2 md:min-h-full md:border-b-0 md:border-l"
        aria-label="Khung ảnh động đăng nhập"
      >
        <img
          src={animatedArtwork}
          alt="Ảnh minh họa đăng nhập"
          className="block h-full min-h-56 w-full object-cover"
        />
      </div>
    </div>
  );
}
