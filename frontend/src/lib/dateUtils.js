// Utility functions for Notice Days and Date formatting in Thai locale

/**
 * Returns minimum allowable date string (YYYY-MM-DD) based on local time and notice days.
 * @param {number} noticeDays - Number of days in advance
 * @returns {string} - "YYYY-MM-DD"
 */
export function getMinDateString(noticeDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, parseInt(noticeDays, 10) || 0));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD string into a readable Thai date string
 * Example: 2026-09-28 -> 28 กันยายน 2569 (or 28 ก.ย. 2569 if short=true)
 * @param {string} dateStr 
 * @param {boolean} short 
 * @returns {string}
 */
export function formatThaiDate(dateStr, short = false) {
  if (!dateStr) return "-";
  const dateOnly = String(dateStr).slice(0, 10);
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: short ? "short" : "long",
    day: "numeric",
  });
}
