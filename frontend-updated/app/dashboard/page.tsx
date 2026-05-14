"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResumeSummary, getCaseStudyHistory, getIntroHistory, getFinalReport } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAppState } from "@/lib/useAppState";
import {
  CheckCircle,
  Lock,
  ArrowRight,
  BookOpen,
  Mic,
  Video,
  User,
  Zap,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const appState = useAppState();
  const [loading, setLoading] = useState(true);

  const [hasSetup, setHasSetup] = useState(false);
  const [hasCaseStudy, setHasCaseStudy] = useState(false);
  const [hasPassedIntro, setHasPassedIntro] = useState(false);
  const [hasPassedInterview, setHasPassedInterview] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) {
      router.push("/setup");
      return;
    }

    const checkPipelineStatus = async () => {
      try {
        const resumeSummary = await getResumeSummary(sid);
        if (resumeSummary.resume_text) setHasSetup(true);
        if (resumeSummary.candidate_name) {
          localStorage.setItem("candidate_name", resumeSummary.candidate_name);
        }

        try {
          const csHist = await getCaseStudyHistory(sid);
          const caseStudies = csHist.aiprep_tool_case_studies || csHist.case_studies || [];
          if (caseStudies.length > 0) {
            setHasCaseStudy(true);
          }
        } catch (e) {}

        try {
          const introHist = await getIntroHistory(sid);
          const attempts = introHist.aiprep_tool_attempts || introHist.history || introHist.attempts || [];
          if (attempts.length > 0) {
            const passedAny = attempts.some((a: any) => a.score >= 70);
            setHasPassedIntro(passedAny);
          }
        } catch (e) {}

        try {
          const report = await getFinalReport(sid);
          if (report?.interview_complete) {
            setHasPassedInterview(true);
          }
        } catch (e) {}
      } catch (err) {
        console.error("Failed to load pipeline stats:", err);
      } finally {
        setLoading(false);
      }
    };

    checkPipelineStatus();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("session_id");
    localStorage.removeItem("candidate_name");
    localStorage.removeItem("api_provider");
    router.push("/");
  };

  const steps = [
    {
      id: "setup",
      icon: User,
      title: "Complete Setup",
      desc: "Upload resume and connect your AI API key",
      href: "/setup",
      status: hasSetup ? "completed" : "pending",
      btnText: hasSetup ? "Update" : "Start",
    },
    {
      id: "project",
      icon: BookOpen,
      title: "Preparation Hub",
      desc: "Build case studies and prepare your project explanation",
      href: "/preparation-hub",
      status: hasCaseStudy ? "completed" : hasSetup ? "pending" : "locked",
      btnText: "Go to Hub",
    },
    {
      id: "intro",
      icon: Mic,
      title: "Intro Practice",
      desc: "Record and refine your professional introduction",
      href: "/intro",
      status: hasPassedIntro ? "completed" : hasSetup ? "pending" : "locked",
      btnText: hasPassedIntro ? "Practice Again" : "Practice Now",
    },
    {
      id: "interviews",
      icon: Video,
      title: "Mock Interviews",
      desc: "Practice real interview scenarios with AI",
      href: "/interview-select",
      status: hasPassedInterview ? "completed" : hasSetup ? "pending" : "locked",
      btnText: "Start Interview",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        candidateName={appState.candidateName}
        onLogout={handleLogout}
        theme={appState.theme}
        onThemeToggle={() => appState.setTheme(appState.theme === "light" ? "dark" : "light")}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700 border-t-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      candidateName={appState.candidateName}
      onLogout={handleLogout}
      theme={appState.theme}
      onThemeToggle={() => appState.setTheme(appState.theme === "light" ? "dark" : "light")}
    >
      {/* Welcome Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {appState.candidateName}! 👋
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Continue your journey to ace your next interview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Setup", done: hasSetup },
          { label: "Case Studies", done: hasCaseStudy },
          { label: "Intro Ready", done: hasPassedIntro },
          { label: "Interviews", done: hasPassedInterview },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardBody className="py-6">
              <div className="flex justify-center mb-3">
                {stat.done ? (
                  <CheckCircle className="text-emerald-500" size={28} />
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                )}
              </div>
              <p className="text-sm font-600 text-gray-700 dark:text-gray-300">
                {stat.label}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Pipeline Steps */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Your Interview Journey
        </h2>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isLocked = step.status === "locked";
            const isCompleted = step.status === "completed";
            const Icon = step.icon;

            return (
              <Card
                key={step.id}
                className={isLocked ? "opacity-50" : ""}
              >
                <CardBody className="py-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        isCompleted
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : isLocked
                            ? "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-500"
                            : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={24} /> : isLocked ? <Lock size={24} /> : idx + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {step.title}
                            {isLocked && (
                              <span className="text-xs font-600 text-amber-600 dark:text-amber-400">
                                Locked
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {step.desc}
                          </p>
                        </div>
                        <Badge
                          status={step.status === "locked" ? "not-started" : step.status as "completed" | "in-progress" | "not-started"}
                        >
                          {step.status === "completed"
                            ? "Done"
                            : step.status === "locked"
                              ? "Locked"
                              : "In Progress"}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isLocked && (
                      <Button
                        variant={isCompleted ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => router.push(step.href)}
                        icon={<ArrowRight size={16} />}
                        className="flex-shrink-0"
                      >
                        {step.btnText}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Next Steps Suggestion */}
      {hasSetup && !hasCaseStudy && (
        <Card className="border-l-4 border-l-amber-500">
          <CardBody>
            <div className="flex items-start gap-4">
              <Zap className="text-amber-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  Next: Explore Your Case Studies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Head to the Preparation Hub to explain your projects and generate comprehensive case studies.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/preparation-hub")}
                  icon={<ArrowRight size={16} />}
                >
                  Go to Preparation Hub
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </DashboardLayout>
  );
}
