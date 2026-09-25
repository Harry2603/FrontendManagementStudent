import { memo } from "react";

const SELECT_CLASS =
  "w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-500";

function SelectBase({
  name,
  label,
  options,
  value,
  error,
  onChange,
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
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        className={SELECT_CLASS}
      >
        <option value="">-- Select --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default memo(SelectBase);
