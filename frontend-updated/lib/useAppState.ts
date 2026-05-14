"use client";

import { useState, useEffect } from "react";

export interface AppState {
  sessionId: string;
  candidateName: string;
  introGenerated: boolean;
  projectsGenerated: boolean;
  caseStudiesGenerated: boolean;
  lastVisitedSection: "dashboard" | "projects" | "case-studies" | "intro" | null;
  theme: "light" | "dark";
}

const STORAGE_KEY = "app_state";

export function useAppState() {
  const [state, setState] = useState<AppState>({
    sessionId: "",
    candidateName: "",
    introGenerated: false,
    projectsGenerated: false,
    caseStudiesGenerated: false,
    lastVisitedSection: null,
    theme: "dark",
  });

  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionId = localStorage.getItem("session_id") || "";
    const candidateName = localStorage.getItem("candidate_name") || "";
    const theme = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    const savedState = localStorage.getItem(STORAGE_KEY);

    const parsedState = savedState ? JSON.parse(savedState) : {};

    setState({
      sessionId,
      candidateName,
      introGenerated: parsedState.introGenerated || false,
      projectsGenerated: parsedState.projectsGenerated || false,
      caseStudiesGenerated: parsedState.caseStudiesGenerated || false,
      lastVisitedSection: parsedState.lastVisitedSection || null,
      theme,
    });

    setMounted(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        introGenerated: state.introGenerated,
        projectsGenerated: state.projectsGenerated,
        caseStudiesGenerated: state.caseStudiesGenerated,
        lastVisitedSection: state.lastVisitedSection,
      })
    );
  }, [state, mounted]);

  const markIntroGenerated = () =>
    setState((s) => ({ ...s, introGenerated: true }));

  const markProjectsGenerated = () =>
    setState((s) => ({ ...s, projectsGenerated: true }));

  const markCaseStudiesGenerated = () =>
    setState((s) => ({ ...s, caseStudiesGenerated: true }));

  const setLastVisitedSection = (section: AppState["lastVisitedSection"]) =>
    setState((s) => ({ ...s, lastVisitedSection: section }));

  const setTheme = (theme: "light" | "dark") => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    setState((s) => ({ ...s, theme }));
  };

  return {
    ...state,
    markIntroGenerated,
    markProjectsGenerated,
    markCaseStudiesGenerated,
    setLastVisitedSection,
    setTheme,
    mounted,
  };
}
