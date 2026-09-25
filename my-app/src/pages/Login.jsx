import { LoginForm } from "@/features/auth";
import { FaceLoginPanel } from "@/features/face";
import { useLocation, useSearchParams } from "react-router-dom";
export default function Login() {

  const isAdmin = useLocation().pathname === "/admin/login";
  const [searchParams, setSearchParams] = useSearchParams();
  const isFaceLogin = !isAdmin && searchParams.get("method") === "face";
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {isFaceLogin ? (
        <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-8 shadow">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Sign in with Face ID
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              The camera will capture three frames a short time apart.
            </p>
          </div>

          <FaceLoginPanel />

          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="w-full rounded border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in with password
          </button>
        </div>
      ) : (
      <LoginForm />
            )}
    </div>
  );
}
