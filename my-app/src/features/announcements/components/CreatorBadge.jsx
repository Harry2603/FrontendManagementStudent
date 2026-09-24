const ROLE_BADGE = {
  ADMIN: { dot: "bg-red-500", label: "Admin" },
  TEACHER: { dot: "bg-yellow-400", label: "Teacher" },
};

export default function CreatorBadge({ role }) {
  const style = ROLE_BADGE[role];
  if (!style) return null; // Student không tạo được thông báo -> không có badge

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
