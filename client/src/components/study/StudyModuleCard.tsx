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
    icon: "bg-primary text-primary-foreground",
    border: "hover:border-border",
    meta: "border-[var(--border-strong)] bg-secondary text-secondary-foreground",
  },
  zinc: {
    icon: "bg-secondary text-secondary-foreground",
    border: "hover:border-border",
    meta: "border-[var(--border-strong)] bg-secondary text-secondary-foreground",
  },
  blue: {
    icon: "bg-blue-600 text-white",
    border: "hover:border-border",
    meta: "border-[var(--border-strong)] bg-secondary text-secondary-foreground",
  },
  green: {
    icon: "bg-emerald-600 text-white",
    border: "hover:border-border",
    meta: "border-[var(--border-strong)] bg-secondary text-secondary-foreground",
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
          "group block h-full rounded-[1.2rem] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-secondary",
          styles.border,
          className
        )}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                styles.icon
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
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
