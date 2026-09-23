import { memo } from "react";

const VARIANT_STYLES = {
  success: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
  warning: "bg-yellow-50 text-yellow-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-gray-100 text-gray-700",
};

const DOT_STYLES = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
  neutral: "bg-gray-400",
};

function Badge({
  children,
  variant = "neutral",
  withDot = false,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]} ${className}`}
    >
      {withDot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_STYLES[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

export default memo(Badge);
