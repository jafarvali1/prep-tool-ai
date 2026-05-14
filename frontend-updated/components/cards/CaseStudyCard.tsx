"use client";

import { ReactNode } from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowRight, FileText, Download } from "lucide-react";

interface CaseStudyCardProps {
  title: string;
  domain: string;
  lastUpdated?: string;
  status: "completed" | "in-progress" | "not-started";
  onView: () => void;
  onExport?: () => void;
  icon?: ReactNode;
}

export default function CaseStudyCard({
  title,
  domain,
  lastUpdated,
  status,
  onView,
  onExport,
  icon,
}: CaseStudyCardProps) {
  const statusText = {
    completed: "Ready",
    "in-progress": "Generating",
    "not-started": "Not Started",
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-xl dark:hover:shadow-indigo-500/20">
      <CardBody className="flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-xs font-600 text-indigo-600 dark:text-indigo-400 mb-2">
              {domain}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Updated {lastUpdated}
              </p>
            )}
          </div>
          {icon && <div className="ml-4 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between">
        <Badge status={status}>{statusText[status]}</Badge>
        <div className="flex gap-2">
          {onExport && status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              icon={<Download size={16} />}
            >
              Export
            </Button>
          )}
          <Button
            variant={status === "completed" ? "ghost" : "primary"}
            size="sm"
            onClick={onView}
            icon={<ArrowRight size={16} />}
          >
            {status === "completed" ? "View" : "Generate"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
