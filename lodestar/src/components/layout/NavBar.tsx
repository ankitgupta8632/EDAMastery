"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Search, Layers3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Feed", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/add", label: "Add", icon: Plus, match: (p: string) => p.startsWith("/add"), primary: true },
  { href: "/topics", label: "Topics", icon: Layers3, match: (p: string) => p.startsWith("/topics") || p.startsWith("/library") },
  { href: "/you", label: "You", icon: User, match: (p: string) => p.startsWith("/you") },
];

export function NavBar(): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0A0A0B]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 safe-bottom">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                active ? "text-white" : "text-white/45 hover:text-white/70"
              )}
            >
              {t.primary ? (
                <span className="mb-0.5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#F5B754] to-[#FF7A7A] text-black shadow-[0_8px_24px_rgba(245,183,84,0.25)]">
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              ) : (
                <Icon className={cn("h-5 w-5", active ? "opacity-100" : "opacity-85")} strokeWidth={active ? 2.4 : 2} />
              )}
              {!t.primary && <span className="font-medium">{t.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
