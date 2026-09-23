// src/components/ui/StatusBadge.jsx
const STATUS_STYLE = {
  active: { dot: "bg-green-500", text: "text-green-700 bg-green-50" },
  inactive: { dot: "bg-gray-400", text: "text-gray-600 bg-gray-100" },
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() ?? "inactive";
  const style = STATUS_STYLE[key] ?? STATUS_STYLE.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
