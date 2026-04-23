import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type StudyModuleTone = "orange" | "zinc" | "blue" | "green";

interface StudyModuleCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  meta?: string;
  tone?: StudyModuleTone;
  className?: string;
}

const toneClasses: Record<
  StudyModuleTone,
  { icon: string; border: string; meta: string }
> = {
  orange: {
    icon: "bg-orange-500 text-white shadow-orange-950/20",
    border: "hover:border-orange-300/45",
    meta: "border-orange-400/30 bg-orange-500/12 text-orange-300",
  },
  zinc: {
    icon: "bg-zinc-900 text-orange-300 shadow-zinc-950/20",
    border: "hover:border-zinc-300/35",
    meta: "border-white/15 bg-white/[0.08] text-zinc-300",
  },
  blue: {
    icon: "bg-blue-600 text-white shadow-blue-950/20",
    border: "hover:border-blue-300/45",
    meta: "border-blue-400/30 bg-blue-500/12 text-blue-300",
  },
  green: {
    icon: "bg-emerald-600 text-white shadow-emerald-950/20",
    border: "hover:border-emerald-300/45",
    meta: "border-emerald-400/30 bg-emerald-500/12 text-emerald-300",
  },
};

export function StudyModuleCard({
  href,
  icon: Icon,
  title,
  subtitle,
  meta,
  tone = "orange",
  className,
}: StudyModuleCardProps) {
  const styles = toneClasses[tone];

  return (
    <Link href={href}>
      <div
        className={cn(
          "group block h-full rounded-[1.2rem] border border-white/10 bg-zinc-950/78 p-4 shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-black/30",
          styles.border,
          className
        )}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg",
                styles.icon
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <ChevronRight className="mt-1 h-4 w-4 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-orange-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-black tracking-tight text-zinc-100">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {subtitle}
            </p>
          </div>

          {meta && (
            <span
              className={cn(
                "mt-auto w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold",
                styles.meta
              )}
            >
              {meta}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
