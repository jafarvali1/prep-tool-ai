"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIntroHistory, getCaseStudyHistory, getLatestProject } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectCard from "@/components/cards/ProjectCard";
import CaseStudyCard from "@/components/cards/CaseStudyCard";
import IntroCard from "@/components/cards/IntroCard";
import Button from "@/components/ui/Button";
import { useAppState } from "@/lib/useAppState";
import { BookOpen, FileText, Mic, Plus } from "lucide-react";

export default function PreparationHub() {
  const router = useRouter();
  const appState = useAppState();
  const [activeTab, setActiveTab] = useState<"projects" | "case-studies" | "intro">("projects");
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [caseStudies, setCaseStudies] = useState<any[]>([]);
  const [introHistory, setIntroHistory] = useState<any[]>([]);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) {
      router.push("/setup");
      return;
    }

    const loadData = async () => {
      try {
        // Load projects
        try {
          const project = await getLatestProject(sid);
          if (project && Object.keys(project).length > 0) {
            setProjectData(project);
          }
        } catch (e) {
          console.error("Failed to load project:", e);
        }

        // Load case studies
        try {
          const csHist = await getCaseStudyHistory(sid);
          const cs = csHist.aiprep_tool_case_studies || csHist.case_studies || [];
          setCaseStudies(cs);
        } catch (e) {
          console.error("Failed to load case studies:", e);
        }

        // Load intro history
        try {
          const introHist = await getIntroHistory(sid);
          const attempts = introHist.aiprep_tool_attempts || introHist.history || introHist.attempts || [];
          setIntroHistory(attempts);
        } catch (e) {
          console.error("Failed to load intro history:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("session_id");
    localStorage.removeItem("candidate_name");
    localStorage.removeItem("api_provider");
    router.push("/");
  };

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
            <p className="text-gray-600 dark:text-gray-400">Loading preparation materials...</p>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Preparation Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Master your interview with case studies, projects, and intro practice
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-slate-700/50">
        {[
          { id: "projects", label: "Projects", icon: FileText },
          { id: "case-studies", label: "Case Studies", icon: BookOpen },
          { id: "intro", label: "Intro Practice", icon: Mic },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-600 transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div>
          {projectData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectCard
                title={projectData.product || "Your Project"}
                description={projectData.business_value || "Click to view and edit your project details"}
                status={projectData ? "completed" : "not-started"}
                onPrimaryAction={() => router.push("/project-explanation")}
                onSecondaryAction={() => router.push("/project-explanation")}
                primaryLabel="View & Edit"
                secondaryLabel="Improve"
                icon={<FileText size={24} />}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-400 dark:text-slate-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Projects Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add your first project to get AI feedback and generate case studies
              </p>
              <Button onClick={() => router.push("/project-explanation")}>
                <Plus size={18} />
                Add First Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Case Studies Tab */}
      {activeTab === "case-studies" && (
        <div>
          {caseStudies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudies.map((cs, idx) => (
                <CaseStudyCard
                  key={idx}
                  title={cs.domain || cs.title || `Case Study ${idx + 1}`}
                  domain={cs.domain || "Custom"}
                  lastUpdated={cs.created_at ? new Date(cs.created_at).toLocaleDateString() : undefined}
                  status="completed"
                  onView={() => router.push(`/case-study?id=${idx}`)}
                  onExport={() => {
                    // PDF export logic
                    console.log("Export case study:", cs);
                  }}
                  icon={<BookOpen size={24} />}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-400 dark:text-slate-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Case Studies Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your project explanation to generate case studies
              </p>
              <Button onClick={() => router.push("/case-study")}>
                <Plus size={18} />
                Generate Case Study
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Intro Tab */}
      {activeTab === "intro" && (
        <div>
          {introHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {introHistory.map((attempt, idx) => (
                <IntroCard
                  key={idx}
                  title={`Attempt ${idx + 1}`}
                  score={attempt.score || 0}
                  maxScore={100}
                  feedback={attempt.feedback || attempt.evaluation?.feedback}
                  status={attempt.score >= 70 ? "completed" : "in-progress"}
                  onPractice={() => router.push("/intro")}
                  onImprove={() => router.push("/intro")}
                  icon={<Mic size={24} />}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mic size={48} className="mx-auto mb-4 text-gray-400 dark:text-slate-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start Your Intro Practice
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Record your introduction and get instant AI feedback on your performance
              </p>
              <Button onClick={() => router.push("/intro")}>
                <Mic size={18} />
                Start Practice
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
