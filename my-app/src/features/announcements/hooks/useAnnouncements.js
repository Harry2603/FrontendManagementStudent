import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { announcementService } from "../services/announcementService";

const PAGE_SIZE = 10;

function getPageFromParams(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function useAnnouncements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const pageNumber = getPageFromParams(searchParams.get("pageNumber"));
  const title = searchParams.get("title") ?? "";
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // fetchPage tách riêng khỏi useEffect để có thể gọi lại thủ công (refetch sau khi tạo mới)
  const updateQueryParams = useCallback((updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, String(value));
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const fetchPage = useCallback(async (page, searchTitle = title) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await announcementService.getAll({
        title: searchTitle,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items ?? []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [title]);

  useEffect(() => {
    fetchPage(pageNumber);
  }, [fetchPage, pageNumber]);

  const nextPage = useCallback(() => {
    if (pageNumber < totalPages) updateQueryParams({ pageNumber: pageNumber + 1 });
  }, [pageNumber, totalPages, updateQueryParams]);

  const prevPage = useCallback(() => {
    if (pageNumber > 1) updateQueryParams({ pageNumber: pageNumber - 1 });
  }, [pageNumber, updateQueryParams]);

  const searchByTitle = useCallback((nextTitle) => {
    updateQueryParams({ title: nextTitle.trim(), pageNumber: 1 });
  }, [updateQueryParams]);

  // Sau khi tạo thành công, quay về trang 1 vì thông báo mới nhất
  // thường được backend trả đầu danh sách (giả định theo createdAt desc).
  const createAnnouncement = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      try {
        await announcementService.create(payload);
        updateQueryParams({ pageNumber: 1 });
        return { success: true };
      } catch (err) {
        return { success: false, error: err };
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateQueryParams],
  );

  return {
    items,
    title,
    pageNumber,
    totalPages,
    isLoading,
    error,
    isSubmitting,
    nextPage,
    prevPage,
    searchByTitle,
    createAnnouncement,
  };
}
