const VARIANT_CLASS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60",
  secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
};

export default function Button({
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded py-2 font-medium transition-colors ${VARIANT_CLASS[variant]}`}
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
