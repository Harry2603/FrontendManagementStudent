import { ArrowLeft, BookOpen, Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function NotFound() {
  const { user } = useAuth();
  const homePath = user ? "/" : "/login";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_30%)]" />

      <section className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
        <div className="grid md:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-h-64 items-center justify-center bg-slate-900 p-8 text-white md:min-h-[360px]">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30">
                <SearchX size={52} strokeWidth={1.5} />
              </div>
              <p className="mt-6 text-6xl font-bold tracking-tight text-white">404</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Page not found
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen size={22} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Student portal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              This classroom is empty
            </h1>
            <p className="mt-4 max-w-md leading-7 text-slate-600">
              The page or course material you are looking for may have moved, or
              the address may be incorrect.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={homePath}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Home size={17} />
                {user ? "Back to dashboard" : "Go to login"}
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <ArrowLeft size={17} />
                Go back
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}