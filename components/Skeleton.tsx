import React from "react";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`shimmer-bg rounded-md ${className || ""}`}
      {...props}
    />
  );
}
