import { ROLES } from "@/config/constants";
import { useAuth } from "@/features/auth";
import { FaceManagement } from "@/features/face";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-600">
          Manage your account preferences and security.
        </p>
      </div>

      {user.role === ROLES.STUDENT && <FaceManagement />}
    </div>
  );
}
