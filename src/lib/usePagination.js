import { useEffect, useState } from 'react'

export function usePagination(rows, pageSize = 10, resetKey = '') {
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [resetKey])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pageCount)
  return {
    page: current,
    setPage,
    pageCount,
    pageRows: rows.slice((current - 1) * pageSize, current * pageSize),
    total: rows.length,
    pageSize,
  }
}
