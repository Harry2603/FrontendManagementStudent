// src/components/ui/Table/Table.jsx
import { memo, useEffect } from "react";
import { useTable } from "./useTable";

function SortIcon({ direction }) {
  return (
    <span className="ml-1 inline-flex flex-col justify-center leading-none">
      <svg width="8" height="5" viewBox="0 0 8 5">
        <path d="M4 0L8 5H0L4 0Z" className={direction === "asc" ? "fill-gray-900" : "fill-gray-300"} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className="mt-0.5">
        <path d="M4 5L0 0H8L4 5Z" className={direction === "desc" ? "fill-gray-900" : "fill-gray-300"} />
      </svg>
    </span>
  );
}

// memo TableRow: khi tick 1 checkbox, chỉ dòng đó re-render (props isSelected
// của các dòng khác không đổi) thay vì re-render toàn bộ bảng.
const TableRow = memo(function TableRow({ row, columns, rowKey, selectable, isSelected, onToggleRow }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      {selectable && (
        <td className="w-10 px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleRow(row)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
      )}
      {columns.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
          {col.render ? col.render(row) : row[col.key]}
        </td>
      ))}
    </tr>
  );
});

export default function Table({
  columns,
  data,
  rowKey = (row) => row.id,
  selectable = false,
  onSelectionChange,
  emptyMessage = "Không có dữ liệu",
}) {
  const {
    sortedData,
    sortConfig,
    toggleSort,
    isRowSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
    selectedKeys,
  } = useTable({ data, rowKey });

  // Báo danh sách key đã chọn ra ngoài cho page cha (vd để bật nút "Xoá đã chọn")
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedKeys));
  }, [selectedKeys, onSelectionChange]);

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-max border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => toggleSort(col.key, col.sortFn) : undefined}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-600 ${
                  col.sortable ? "cursor-pointer select-none" : ""
                }`}
              >
                <span className="inline-flex items-center">
                  {col.header}
                  {col.sortable && (
                    <SortIcon direction={sortConfig?.key === col.key ? sortConfig.direction : null} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <TableRow
                key={rowKey(row)}
                row={row}
                columns={columns}
                rowKey={rowKey}
                selectable={selectable}
                isSelected={isRowSelected(row)}
                onToggleRow={toggleRow}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}