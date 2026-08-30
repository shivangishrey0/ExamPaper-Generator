import React from "react";

export function TableRowSkeleton({ rows = 5, columns = 4 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-t animate-pulse">
          {[...Array(columns)].map((_, j) => (
            <td key={j} className="p-3"><div className="h-3 bg-stone-100 rounded w-full" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
          <div className="h-4 bg-stone-100 rounded w-48 mb-2" />
          <div className="h-3 bg-stone-100 rounded w-32" />
        </div>
      ))}
    </>
  );
}
