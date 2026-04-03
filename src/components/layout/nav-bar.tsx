"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  BarChart3,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Awards", icon: Trophy },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch("/api/review?userId=default-user&countOnly=true")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.count != null) setReviewCount(data.count);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100">
      <div className="mx-auto flex h-[68px] max-w-lg items-center justify-around px-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-all duration-200",
                  )}
                  fill={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? 1.5 : 1.8}
                />
                {item.label === "Review" && reviewCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {reviewCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-bold" : "font-medium"
              )}>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 h-[3px] w-5 rounded-full bg-indigo-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
