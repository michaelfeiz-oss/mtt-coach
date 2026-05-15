import { BookOpen, Database, Dumbbell, Home, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/strategy/library", label: "Library", icon: BookOpen },
  { href: "/strategy/trainer", label: "Drills", icon: Dumbbell },
  { href: "/admin/import-export", label: "Backup", icon: Database },
  { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
];

export function LocalShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pt-8">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-semibold ${
                  active
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{title}</h1>
          {body ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{body}</p> : null}
        </div>
        {action}
      </div>
    </section>
  );
}
