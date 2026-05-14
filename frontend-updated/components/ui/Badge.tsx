"use client";

import clsx from "clsx";

interface BadgeProps {
  status: "completed" | "in-progress" | "not-started";
  children: string;
}

export default function Badge({ status, children }: BadgeProps) {
  const statusStyles = {
    completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
    "in-progress": "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    "not-started": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  };

  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-xs font-600 inline-block",
        statusStyles[status]
      )}
    >
      {children}
    </span>
  );
}
