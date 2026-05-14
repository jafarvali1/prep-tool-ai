"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Briefcase, Bot, Code, Zap, CheckCircle } from "lucide-react";
import clsx from "clsx";

export interface InterviewConfig {
  type: "recruiter" | "behavioral" | "ai-engineer" | "ml-engineer" | "data-scientist" | null;
  level: "junior" | "senior" | "staff" | "principal" | null;
}

interface InterviewTypeSelectionProps {
  onSelectType: (type: InterviewConfig["type"]) => void;
  onSelectLevel: (level: InterviewConfig["level"]) => void;
  onStart: (config: InterviewConfig) => void;
  currentConfig: InterviewConfig;
}

export default function InterviewTypeSelection({
  onSelectType,
  onSelectLevel,
  onStart,
  currentConfig,
}: InterviewTypeSelectionProps) {
  const interviewTypes = [
    {
      id: "recruiter",
      title: "Recruiter Screening",
      description: "Quick conversation about your background and motivations",
      icon: Briefcase,
    },
    {
      id: "behavioral",
      title: "Behavioral Interview",
      description: "STAR method questions about your past experiences",
      icon: Zap,
    },
    {
      id: "ai-engineer",
      title: "AI Engineer",
      description: "Technical questions about AI/ML systems and architectures",
      icon: Bot,
    },
    {
      id: "ml-engineer",
      title: "ML Engineer",
      description: "Deep dive into machine learning concepts and implementation",
      icon: Code,
    },
    {
      id: "data-scientist",
      title: "Data Scientist",
      description: "Questions on data analysis, modeling, and insights",
      icon: Code,
    },
  ];

  const levels = [
    { id: "junior", label: "Junior", description: "0-2 years" },
    { id: "senior", label: "Senior", description: "5-8 years" },
    { id: "staff", label: "Staff", description: "8-12 years" },
    { id: "principal", label: "Principal", description: "12+ years" },
  ];

  const canProceed = currentConfig.type && currentConfig.level;

  return (
    <div className="space-y-12">
      {/* Step 1: Select Interview Type */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold mr-3">
            1
          </span>
          Choose Interview Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviewTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = currentConfig.type === type.id;

            return (
              <Card
                key={type.id}
                className={clsx(
                  "cursor-pointer transition-all duration-200",
                  isSelected &&
                    "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg dark:shadow-indigo-500/20"
                )}
                onClick={() => onSelectType(type.id as any)}
              >
                <CardBody className="py-6">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="text-indigo-600 dark:text-indigo-400" size={28} />
                    {isSelected && (
                      <CheckCircle className="text-emerald-500" size={24} />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Level */}
      {currentConfig.type && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold mr-3">
              2
            </span>
            Select Experience Level
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {levels.map((level) => {
              const isSelected = currentConfig.level === level.id;

              return (
                <Card
                  key={level.id}
                  className={clsx(
                    "cursor-pointer transition-all duration-200 text-center",
                    isSelected &&
                      "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg dark:shadow-indigo-500/20"
                  )}
                  onClick={() => onSelectLevel(level.id as any)}
                >
                  <CardBody className="py-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      {level.label}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {level.description}
                    </p>
                    {isSelected && (
                      <div className="mt-3">
                        <CheckCircle className="text-emerald-500 mx-auto" size={20} />
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Start Interview */}
      {canProceed && (
        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={() => onSelectType(null)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onStart(currentConfig)}
            className="flex-1"
            icon={<CheckCircle size={20} />}
          >
            Start Interview
          </Button>
        </div>
      )}
    </div>
  );
}
