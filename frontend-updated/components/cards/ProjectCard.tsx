"use client";

import { ReactNode } from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowRight, Pencil, Zap } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  status: "completed" | "in-progress" | "not-started";
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  icon?: ReactNode;
}

export default function ProjectCard({
  title,
  description,
  status,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = "Continue",
  secondaryLabel = "Improve",
  icon,
}: ProjectCardProps) {
  const statusText = {
    completed: "Completed",
    "in-progress": "In Progress",
    "not-started": "Not Started",
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-xl dark:hover:shadow-indigo-500/20">
      <CardBody className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
          {icon && <div className="ml-4 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between">
        <Badge status={status}>{statusText[status]}</Badge>
        <div className="flex gap-2">
          {status !== "not-started" && onSecondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSecondaryAction}
              icon={<Pencil size={16} />}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant={status === "completed" ? "ghost" : "primary"}
            size="sm"
            onClick={onPrimaryAction}
            icon={<ArrowRight size={16} />}
          >
            {primaryLabel}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
