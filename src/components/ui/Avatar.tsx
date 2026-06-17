import React from "react";
import { cn, initials, avatarColor } from "../../lib/utils";

export function Avatar({
  name,
  src,
  size = 32,
  className,
  title,
  ring = false,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  title?: string;
  ring?: boolean;
}) {
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.4) };
  return (
    <div
      title={title ?? name}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 overflow-hidden select-none",
        ring && "ring-2 ring-white",
        className
      )}
      style={src ? { ...style } : { ...style, background: avatarColor(name) }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}

/** Overlapping stack of avatars with a +N overflow chip. */
export function AvatarStack({
  people,
  size = 28,
  max = 4,
}: {
  people: { name: string; src?: string }[];
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}>
          <Avatar name={p.name} src={p.src} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{ marginLeft: -8, width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
          className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-semibold ring-2 ring-white"
        >
          +{extra}
        </div>
      )}
      {people.length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
    </div>
  );
}
