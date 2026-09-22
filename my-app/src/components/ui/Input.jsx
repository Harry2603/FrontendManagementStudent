import { memo } from "react";

const INPUT_CLASS =
  "w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-500";

function InputBase({
  name,
  label,
  type = "text",
  value,
  error,
  onChange,
  autoComplete,
  max,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        autoComplete={autoComplete}
        max={max}
        disabled={disabled}
        aria-invalid={!!error}
        className={INPUT_CLASS}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// memo: gõ ở field này không làm field khác re-render (giống pattern Field trong RegisterForm)
export default memo(InputBase);
