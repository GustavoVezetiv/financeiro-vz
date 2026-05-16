"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/lib/navigation";

type TopbarProps = {
  items: NavigationItem[];
};

export function Topbar({ items }: TopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-950/10 bg-white/86 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint-600 lg:hidden">
            Financeiro VZ
          </p>
          <p className="text-sm font-medium text-ink-600">
            Fundação visual sem autenticação real
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md border border-ink-950/10 bg-white px-3 py-2 text-sm font-semibold text-ink-950 transition hover:border-mint-500 hover:text-mint-600"
        >
          Login
        </Link>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden"
        aria-label="Navegação mobile"
      >
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                active ? "bg-ink-950 text-white" : "bg-ink-950/5 text-ink-600",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

