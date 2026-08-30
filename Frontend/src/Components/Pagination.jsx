import React from "react";

// Cursor-based: only Prev/Next, no jump-to-page — the API only knows "the next
// batch after this id," not an arbitrary offset. `page` is a client-tracked
// count of how far forward we've navigated, used for the "Page X of Y" label.
export default function Pagination({ page, total, limit, hasPrev, hasMore, onPrev, onNext, className = "" }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-xs text-stone-500">
        Showing {start}–{end} of {total} &bull; Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={!hasPrev}
          className="px-2.5 py-1.5 border rounded text-xs hover:bg-stone-100 disabled:opacity-40">
          ← Prev
        </button>
        <button onClick={onNext} disabled={!hasMore}
          className="px-2.5 py-1.5 border rounded text-xs hover:bg-stone-100 disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  );
}
