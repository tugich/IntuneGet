import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  pageItems: T[];
  page: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { pageSize = 24 } = options;
  const [page, setPageRaw] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  // Clamp page when items shrink (e.g. after filtering)
  useEffect(() => {
    if (page > totalPages) {
      setPageRaw(totalPages);
    }
  }, [page, totalPages]);

  const setPage = useCallback(
    (newPage: number) => {
      setPageRaw(Math.max(1, Math.min(newPage, totalPagesRef.current)));
    },
    []
  );

  const nextPage = useCallback(() => {
    setPageRaw((p) => Math.min(p + 1, totalPagesRef.current));
  }, []);

  const prevPage = useCallback(() => {
    setPageRaw((p) => Math.max(p - 1, 1));
  }, []);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);

  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  return {
    pageItems,
    page,
    totalPages,
    nextPage,
    prevPage,
    canGoNext: page < totalPages,
    canGoPrev: page > 1,
    startIndex,
    endIndex,
    setPage,
  };
}
