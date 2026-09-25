import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { validateEmail, validatePassword } from "@/utils/validators";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { getLoginError } from "../utils/authErrors";
import animatedArtwork from "@/assets/svgviewer-output.svg";

const INITIAL_VALUES = { email: "", password: "" };
const INITIAL_RESET_VALUES = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export default function LoginForm() {
  const { setSession } = useAuth();
  const isAdmin = useLocation().pathname === "/admin/login";
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState("otp");
  const [resetValues, setResetValues] = useState(INITIAL_RESET_VALUES);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [faceFile, setFaceFile] = useState(null);

  const closeResetModal = useCallback(() => {
    setShowResetModal(false);
    setResetMode("otp");
    setResetValues(INITIAL_RESET_VALUES);
    setResetError("");
    setResetToken("");
    setFaceFile(null);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  }, []);

  const handleResetChange = useCallback((e) => {
    const { name, value } = e.target;
    setResetValues((prev) => ({ ...prev, [name]: value }));
    setResetError("");
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
        return;
      }

      setLoading(true);
      try {
        const login = isAdmin ? authService.adminLogin : authService.login;
        const session = await login({
          email: values.email.trim(),
          password: values.password,
        });
        setSession(session);
      } catch (error) {
        setErrors(getLoginError(error));
      } finally {
        setLoading(false);
      }
    },
    [values, isAdmin, setSession],
  );

  const handleRequestOtp = useCallback(async () => {
    const email = resetValues.email.trim();
    if (!email) {
      setResetError("Please enter your email.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      await authService.requestPasswordResetOtp({ email });
      setResetMode("verify");
    } catch (error) {
      setResetError(
        error?.response?.data?.message ||
          "Unable to send the reset code. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }, [resetValues.email]);

  const handleVerifyOtp = useCallback(async () => {
    const email = resetValues.email.trim();
    const otp = resetValues.otp.trim();

    if (!email || !otp) {
      setResetError("Please enter the email and verification code.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      const response = await authService.verifyPasswordResetOtp({ email, otp });
      const token =
        response?.token ??
        response?.resetToken ??
        response?.data?.token ??
        response?.data?.resetToken ??
        "";

      if (!token) {
        setResetError(
          "Verification was successful but the reset token was not returned. Please try again.",
        );
        return;
      }

      setResetToken(token);
      setResetMode("confirm");
    } catch (error) {
      setResetError(
        error?.response?.data?.message ||
          "The verification code is invalid or expired.",
      );
    } finally {
      setResetLoading(false);
    }
  }, [resetValues.email, resetValues.otp]);

  const handleConfirmReset = useCallback(async () => {
    const password = resetValues.newPassword;
    const confirmPassword = resetValues.confirmPassword;

    if (!password || !confirmPassword) {
      setResetError("Please enter and confirm the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setResetError("The new passwords do not match.");
      return;
    }

    if (!resetToken) {
      setResetError("The reset session is missing. Please verify again.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      await authService.confirmPasswordReset({
        token: resetToken,
        resetToken,
        password,
        newPassword: password,
      });
      closeResetModal();
    } catch (error) {
      setResetError(
        error?.response?.data?.message ||
          "Unable to reset the password. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }, [
    closeResetModal,
    resetToken,
    resetValues.confirmPassword,
    resetValues.newPassword,
  ]);

  const handleFaceReset = useCallback(async () => {
    const email = resetValues.email.trim();
    if (!email) {
      setResetError("Please enter your email before face verification.");
      return;
    }

    if (!faceFile) {
      setResetError("Please upload a face image to continue.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      const response = await authService.verifyPasswordResetFace(
        email,
        faceFile,
      );
      const token =
        response?.token ??
        response?.resetToken ??
        response?.data?.token ??
        response?.data?.resetToken ??
        "";
      if (token) {
        setResetToken(token);
      }
      setResetMode("confirm");
    } catch (error) {
      setResetError(
        error?.response?.data?.message ||
          "Face verification failed. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }, [faceFile, resetValues.email]);

  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="order-2 space-y-4 p-6 sm:p-8 md:order-1"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {isAdmin ? "Admin Sign In" : "Sign In"}
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
            Password
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
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 top-2.5 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
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
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {!isAdmin && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetMode("otp");
              }}
              className="w-full rounded border border-slate-200 bg-slate-50 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetMode("face");
                setResetValues((prev) => ({
                  ...prev,
                  email: values.email.trim(),
                }));
              }}
              className="w-full rounded border border-blue-200 bg-blue-50 py-2 font-medium text-blue-700 transition hover:bg-blue-100"
            >
              Reset with Face ID
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/login?method=face")}
          className="w-full rounded border border-blue-200 py-2 font-medium text-blue-700 hover:bg-blue-50"
          hidden={isAdmin}
        >
          Sign in with Face ID
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
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Administrator?{" "}
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                Admin sign in
              </Link>
            </p>
          </>
        )}

        {isAdmin && (
          <p className="text-center text-sm text-gray-600">
            Regular user?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </form>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  {resetMode === "face" ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {resetMode === "face"
                    ? "Face verification"
                    : "Reset password"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
                {resetError}
              </p>
            )}

            {resetMode === "face" ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-face-email"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      id="reset-face-email"
                      name="email"
                      type="email"
                      value={resetValues.email}
                      onChange={handleResetChange}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reset-face-file"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Upload face image
                  </label>
                  <input
                    id="reset-face-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setFaceFile(event.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFaceReset}
                  disabled={resetLoading}
                  className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {resetLoading ? "Verifying..." : "Verify Face"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      value={resetValues.email}
                      onChange={handleResetChange}
                      disabled={
                        resetMode === "verify" || resetMode === "confirm"
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {resetMode === "otp" && (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={resetLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {resetLoading ? "Sending..." : "Send reset code"}
                  </button>
                )}

                {resetMode === "verify" && (
                  <>
                    <div>
                      <label
                        htmlFor="reset-otp"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Verification code
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          size={16}
                          className="pointer-events-none absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          id="reset-otp"
                          name="otp"
                          type="text"
                          value={resetValues.otp}
                          onChange={handleResetChange}
                          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={resetLoading}
                      className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {resetLoading ? "Verifying..." : "Verify code"}
                    </button>
                  </>
                )}

                {resetMode === "confirm" && (
                  <>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        New password
                      </label>
                      <input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        value={resetValues.newPassword}
                        onChange={handleResetChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Confirm password
                      </label>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        value={resetValues.confirmPassword}
                        onChange={handleResetChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      disabled={resetLoading}
                      className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {resetLoading ? "Updating..." : "Update password"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="order-1 min-h-56 overflow-hidden border-b border-slate-200 bg-slate-50 md:order-2 md:min-h-full md:border-b-0 md:border-l"
        aria-label="Animated sign-in illustration"
      >
        <img
          src={animatedArtwork}
          alt="Sign-in illustration"
          className="block h-full min-h-56 w-full object-cover"
        />
      </div>
    </div>
  );
}
