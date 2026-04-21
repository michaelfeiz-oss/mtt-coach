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
    border: "hover:border-orange-300",
    meta: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  zinc: {
    icon: "bg-zinc-950 text-orange-300 shadow-zinc-950/20",
    border: "hover:border-zinc-300",
    meta: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  blue: {
    icon: "bg-blue-600 text-white shadow-blue-950/20",
    border: "hover:border-blue-300",
    meta: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  green: {
    icon: "bg-emerald-600 text-white shadow-emerald-950/20",
    border: "hover:border-emerald-300",
    meta: "bg-emerald-50 text-emerald-700 ring-emerald-100",
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
          "group block h-full rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10",
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
            <ChevronRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-black tracking-tight text-slate-950">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {subtitle}
            </p>
          </div>

          {meta && (
            <span
              className={cn(
                "mt-auto w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
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
