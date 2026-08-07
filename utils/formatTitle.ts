/**
 * Clean title utility that strips leading timestamps (e.g. 1785937683996_),
 * replaces underscores with spaces, and strips file extensions for clean display.
 */
export function cleanDocumentTitle(titleOrPath?: string | null): string {
  if (!titleOrPath) return "Study Material";
  // Extract base filename if it's a file path
  const filename = titleOrPath.split("/").pop() || titleOrPath;
  // Strip leading timestamp prefix (e.g., 1785937683996_)
  const noTimestamp = filename.replace(/^\d+_/, "");
  // Replace underscores with spaces and remove file extension
  const cleaned = noTimestamp
    .replace(/_/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .trim();
  return cleaned || "Study Material";
}
