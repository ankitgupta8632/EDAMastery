"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  PenLine,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_STATUSES } from "@/lib/constants";

interface AdminStats {
  published: number;
  generated: number;
  draft: number;
  reviewed: number;
  totalLessons: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    published: 0,
    generated: 0,
    draft: 0,
    reviewed: 0,
    totalLessons: 0,
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const links = [
    {
      href: "/admin/content",
      icon: PenLine,
      label: "Content Pipeline",
      description: "Generate and manage lesson content",
    },
    {
      href: "/admin/notebooks",
      icon: BookOpen,
      label: "Notebook Manager",
      description: "Manage NotebookLM connections",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 px-4 py-6"
    >
      <h1 className="text-2xl font-bold text-slate-800">Admin</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          label="Published"
          value={stats.published}
        />
        <StatCard
          icon={<FileText className="h-4 w-4 text-blue-500" />}
          label="Generated"
          value={stats.generated}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          label="Reviewed"
          value={stats.reviewed}
        />
        <StatCard
          icon={<PenLine className="h-4 w-4 text-slate-400" />}
          label="Draft"
          value={stats.draft}
        />
      </div>

      {/* Navigation links */}
      <div className="space-y-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {link.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-4">
        {icon}
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}
