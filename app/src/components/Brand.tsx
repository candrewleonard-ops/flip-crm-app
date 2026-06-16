import Image from "next/image";
import { cn } from "@/lib/utils";

export const BRAND = {
  name: "WorkTop CRM",
  tagline: "Run your projects from anywhere.",
  logo: "/WorkTopLogo.svg",
};

export function BrandMark({
  size = 40,
  showWordmark = false,
  className,
  variant = "dark",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={BRAND.logo}
        alt="WorkTop CRM"
        width={size}
        height={size}
        priority
        className="rounded-lg"
      />
      {showWordmark && (
        <div className="leading-tight">
          <p className={cn("font-bold tracking-tight", variant === "dark" ? "text-white" : "text-slate-900")}
             style={{ fontSize: size * 0.42 }}>
            <span className={variant === "dark" ? "text-white" : "text-slate-900"}>Work</span>
            <span className="text-blue-500">Top</span>
          </p>
          <p className={cn("uppercase tracking-[0.2em]", variant === "dark" ? "text-slate-400" : "text-slate-500")}
             style={{ fontSize: size * 0.18 }}>
            CRM
          </p>
        </div>
      )}
    </div>
  );
}
