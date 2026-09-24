import { useMemo, useState } from "react";

export function useTable({ data, rowKey }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((first, second) => {
      const firstValue = first[sortConfig.key] ?? "";
      const secondValue = second[sortConfig.key] ?? "";
      const result = sortConfig.sortFn
        ? sortConfig.sortFn(firstValue, secondValue, first, second)
        : String(firstValue).localeCompare(String(secondValue), "vi", {
            numeric: true,
          });
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [data, sortConfig]);

  const toggleSort = (key, sortFn) => {
    setSortConfig((current) => ({
      key,
      sortFn,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const isRowSelected = (row) => selectedKeys.has(rowKey(row));
  const toggleRow = (row) => {
    const key = rowKey(row);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const isAllSelected =
    data.length > 0 && data.every((row) => selectedKeys.has(rowKey(row)));
  const toggleAll = () => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (isAllSelected) data.forEach((row) => next.delete(rowKey(row)));
      else data.forEach((row) => next.add(rowKey(row)));
      return next;
    });
  };

  return {
    sortedData,
    sortConfig,
    toggleSort,
    isRowSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
    selectedKeys,
  };
}
