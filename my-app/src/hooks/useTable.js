import { useState, useMemo, useCallback } from "react";

/**
 * Hook quản lý state cho Table: sắp xếp (sort) + chọn dòng (selection).
 * Tách khỏi UI để Table.jsx chỉ lo render.
 *
 * @param {Array} data - mảng dữ liệu gốc
 * @param {(row) => string|number} rowKey - hàm lấy key duy nhất của 1 dòng
 */
export function useTable({ data, rowKey = (row) => row.id }) {
  const [sortConfig, setSortConfig] = useState(null); // { key, direction, sortFn }
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  // --- SORT ---
  // useMemo: chỉ sort lại khi data hoặc sortConfig đổi, tránh sort lại mỗi lần
  // component cha re-render vì lý do khác (vd gõ ô search).
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction, sortFn } = sortConfig;

    const sorted = [...data].sort((a, b) => {
      if (sortFn) return sortFn(a, b);
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return valA - valB;
      }
      return String(valA).localeCompare(String(valB), "vi");
    });

    return direction === "desc" ? sorted.reverse() : sorted;
  }, [data, sortConfig]);

  // Click 1: asc -> Click 2: desc -> Click 3: bỏ sort (giống UX ảnh mẫu)
  const toggleSort = useCallback((key, sortFn) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc", sortFn };
      if (prev.direction === "asc") return { key, direction: "desc", sortFn };
      return null;
    });
  }, []);

  // --- SELECTION ---
  // Dùng Set thay vì mảng: kiểm tra "đã chọn chưa" và toggle là O(1),
  // quan trọng khi bảng có nhiều dòng và người dùng tick nhanh.
  const isRowSelected = useCallback(
    (row) => selectedKeys.has(rowKey(row)),
    [selectedKeys, rowKey],
  );

  const toggleRow = useCallback(
    (row) => {
      const key = rowKey(row);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    },
    [rowKey],
  );

  const isAllSelected =
    sortedData.length > 0 &&
    sortedData.every((row) => selectedKeys.has(rowKey(row)));

  const toggleAll = useCallback(() => {
    setSelectedKeys((prev) => {
      if (isAllSelected) return new Set();
      const next = new Set(prev);
      sortedData.forEach((row) => next.add(rowKey(row)));
      return next;
    });
  }, [isAllSelected, sortedData, rowKey]);

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  return {
    sortedData,
    sortConfig,
    toggleSort,
    selectedKeys,
    isRowSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
    clearSelection,
  };
}
