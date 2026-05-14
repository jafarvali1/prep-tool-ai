"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InterviewTypeSelection, { InterviewConfig } from "@/components/sections/InterviewTypeSelection";
import { useAppState } from "@/lib/useAppState";

export default function InterviewSelect() {
  const router = useRouter();
  const appState = useAppState();
  const [config, setConfig] = useState<InterviewConfig>({
    type: null,
    level: null,
  });

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) {
      router.push("/setup");
      return;
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("session_id");
    localStorage.removeItem("candidate_name");
    localStorage.removeItem("api_provider");
    router.push("/");
  };

  const handleSelectType = (type: InterviewConfig["type"]) => {
    setConfig((prev) => ({
      ...prev,
      type,
      level: null, // Reset level when type changes
    }));
  };

  const handleSelectLevel = (level: InterviewConfig["level"]) => {
    setConfig((prev) => ({
      ...prev,
      level,
    }));
  };

  const handleStart = (finalConfig: InterviewConfig) => {
    // Store interview config in localStorage for the actual interview page
    localStorage.setItem(
      "interview_config",
      JSON.stringify(finalConfig)
    );
    // Navigate to the actual interview page
    router.push("/interview");
  };

  return (
    <DashboardLayout
      candidateName={appState.candidateName}
      onLogout={handleLogout}
      theme={appState.theme}
      onThemeToggle={() => appState.setTheme(appState.theme === "light" ? "dark" : "light")}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Start Your Mock Interview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your interview and begin practicing with our AI interviewer
        </p>
      </div>

      <InterviewTypeSelection
        onSelectType={handleSelectType}
        onSelectLevel={handleSelectLevel}
        onStart={handleStart}
        currentConfig={config}
      />
    </DashboardLayout>
  );
}
