// Escapes regex metacharacters so user-typed search/filter text can't alter
// the intended match pattern or degrade matching performance.
export const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
