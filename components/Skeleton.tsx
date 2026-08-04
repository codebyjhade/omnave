import React from "react";

/**
 * Skeleton — Global loading placeholder primitive.
 *
 * Uses the project's own `shimmer-bg` CSS class (globals.css) which drives a
 * smooth left→right shimmer via a pseudo-element. Pass any Tailwind dimension,
 * border-radius, or margin classes via `className` to match the exact geometry
 * of the real content it replaces.
 *
 * ZERO CLS CONTRACT: every Skeleton instance must carry the same `w-*`, `h-*`,
 * and `rounded-*` values as the element it stands in for. Never leave these
 * implicit or the layout will jump on hydration.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={["shimmer-bg rounded-md", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
