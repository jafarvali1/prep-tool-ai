"use client";

import { ReactNode } from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowRight, Zap } from "lucide-react";

interface IntroCardProps {
  title: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
  status: "completed" | "in-progress" | "not-started";
  onPractice: () => void;
  onImprove?: () => void;
  icon?: ReactNode;
}

export default function IntroCard({
  title,
  score,
  maxScore = 100,
  feedback,
  status,
  onPractice,
  onImprove,
  icon,
}: IntroCardProps) {
  const statusText = {
    completed: "Completed",
    "in-progress": "In Progress",
    "not-started": "Not Started",
  };

  const scorePercentage = score && maxScore ? Math.round((score / maxScore) * 100) : 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-xl dark:hover:shadow-indigo-500/20">
      <CardBody className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            {score !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-600 text-gray-600 dark:text-gray-400">
                    Score
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {score}/{maxScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      scorePercentage >= 70
                        ? "bg-emerald-500"
                        : scorePercentage >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            )}
            {feedback && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                "{feedback}"
              </p>
            )}
          </div>
          {icon && <div className="ml-4 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between">
        <Badge status={status}>{statusText[status]}</Badge>
        <div className="flex gap-2">
          {status === "completed" && onImprove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onImprove}
              icon={<Zap size={16} />}
            >
              Improve
            </Button>
          )}
          <Button
            variant={status === "completed" ? "ghost" : "primary"}
            size="sm"
            onClick={onPractice}
            icon={<ArrowRight size={16} />}
          >
            {status === "completed" ? "Practice Again" : "Start Practice"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
