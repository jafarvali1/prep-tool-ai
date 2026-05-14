"use client";

import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "card rounded-2xl border border-slate-200 dark:border-slate-700/50",
        "bg-white dark:bg-slate-900/40",
        "transition-all duration-200",
        "hover:border-indigo-400 dark:hover:border-indigo-500/50",
        "hover:shadow-lg dark:hover:shadow-indigo-500/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx("px-6 py-4 border-b border-slate-200 dark:border-slate-700/50", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx("px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}
