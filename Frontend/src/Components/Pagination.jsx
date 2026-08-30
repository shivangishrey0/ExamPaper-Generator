import React from "react";

export default function Pagination({ page, totalPages, total, limit, onPageChange, className = "" }) {
  if (totalPages <= 1) return null;

  const getPageNums = () => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-xs text-stone-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1.5 border rounded text-xs hover:bg-stone-100 disabled:opacity-40">
          ← Prev
        </button>
        {getPageNums().map((n) => (
          <button key={n} onClick={() => onPageChange(n)}
            className={`px-2.5 py-1.5 border rounded text-xs ${
              n === page ? "bg-stone-900 text-white border-stone-900" : "hover:bg-stone-100"
            }`}>
            {n}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="px-2.5 py-1.5 border rounded text-xs hover:bg-stone-100 disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  );
}
