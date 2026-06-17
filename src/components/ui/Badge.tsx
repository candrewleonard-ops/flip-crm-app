import React from "react";
import { cn } from "../../lib/utils";
import type { Meta } from "../../lib/labels";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("badge", className)}>{children}</span>;
}

/** Status/priority pill driven by a labels Meta entry. */
export function MetaBadge({ meta, dot = true }: { meta: Meta; dot?: boolean }) {
  return (
    <span className={cn("badge", meta.badge)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />}
      {meta.label}
    </span>
  );
}
