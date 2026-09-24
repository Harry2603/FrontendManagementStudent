import { useState, useEffect, useCallback } from "react";
import { announcementService } from "../services/announcementService";

const PAGE_SIZE = 10;

export function useAnnouncements() {
  const [items, setItems] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // fetchPage tách riêng khỏi useEffect để có thể gọi lại thủ công (refetch sau khi tạo mới)
  const fetchPage = useCallback(async (page) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await announcementService.getAll({
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items ?? []);
      setTotalPages(res.totalPages || 1);
      setPageNumber(res.pageNumber || page);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchPage(1));
  }, [fetchPage]);

  const nextPage = useCallback(() => {
    if (pageNumber < totalPages) fetchPage(pageNumber + 1);
  }, [pageNumber, totalPages, fetchPage]);

  const prevPage = useCallback(() => {
    if (pageNumber > 1) fetchPage(pageNumber - 1);
  }, [pageNumber, fetchPage]);

  // Sau khi tạo thành công, quay về trang 1 vì thông báo mới nhất
  // thường được backend trả đầu danh sách (giả định theo createdAt desc).
  const createAnnouncement = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      try {
        await announcementService.create(payload);
        await fetchPage(1);
        return { success: true };
      } catch (err) {
        return { success: false, error: err };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPage],
  );

  return {
    items,
    pageNumber,
    totalPages,
    isLoading,
    error,
    isSubmitting,
    nextPage,
    prevPage,
    createAnnouncement,
  };
}
