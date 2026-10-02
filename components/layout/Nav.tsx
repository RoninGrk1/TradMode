"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/markets", label: "Markets" },
  { href: "/trade", label: "Trade" },
  { href: "/risk", label: "Risk" },
  { href: "/wallet", label: "Wallet" },
  { href: "/agents", label: "Agents" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-[var(--tm-radius-pill)] px-3 py-1.5 text-sm transition ${
              active
                ? "bg-[rgba(59,130,246,0.25)] text-[var(--tm-color-blue-100)] border border-[rgba(59,130,246,0.4)]"
                : "text-[var(--tm-color-text-muted)] hover:text-[var(--tm-color-text)] hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
