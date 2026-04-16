"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResumeSummary, getCaseStudyHistory, getIntroHistory } from "@/lib/api";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FileText,
  User,
  CheckCircle,
  Lock,
  ArrowRight,
  BookOpen,
  Mic,
  Video
} from "lucide-react";

export default function DashboardPipeline() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [loading, setLoading] = useState(true);

  // States for Pipeline Progression
  const [hasSetup, setHasSetup] = useState(false);
  const [hasCaseStudy, setHasCaseStudy] = useState(false);
  const [hasPassedIntro, setHasPassedIntro] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) {
      router.push("/setup");
      return;
    }
    setSessionId(sid);

    const checkPipelineStatus = async () => {
      try {
        // Step 1 Check
        const resumeSummary = await getResumeSummary(sid);
        if (resumeSummary.resume_text) setHasSetup(true);
        if (resumeSummary.candidate_name) {
          localStorage.setItem("candidate_name", resumeSummary.candidate_name);
          setCandidateName(resumeSummary.candidate_name);
        } else {
          setCandidateName(localStorage.getItem("candidate_name") || "");
        }

        // Step 2 & 3 Check (Case study generated)
        try {
          const csHist = await getCaseStudyHistory(sid);
          if (csHist.case_studies && csHist.case_studies.length > 0) {
            setHasCaseStudy(true);
          }
        } catch (e) {}

        // Step 4 Check (Intro passed)
        try {
          const introHist = await getIntroHistory(sid);
          if (introHist.attempts && introHist.attempts.length > 0) {
            const passedAny = introHist.attempts.some((a: any) => a.score >= 70); // Assuming 70+ is passing here
            setHasPassedIntro(passedAny);
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
    localStorage.removeItem("api_provider");
    router.push("/");
  };

  const steps = [
    {
      num: 1,
      id: "setup",
      icon: <User size={24} />,
      title: "Complete Initial Setup",
      desc: "Upload resume and AI API credentials.",
      href: "/setup",
      status: hasSetup ? "completed" : "pending",
      btnText: hasSetup ? "Update Setup" : "Start Setup",
    },
    {
      num: 2,
      id: "project",
      icon: <BookOpen size={24} />,
      title: "Project Explanation & Case Study",
      desc: "Interact with AI to explain your project, give it a usecase, and generate a case study.",
      href: "/project-explanation",
      status: hasCaseStudy ? "completed" : (hasSetup ? "pending" : "locked"),
      btnText: hasCaseStudy ? "Review Project/Case Study" : "Explain Project",
    },
    {
      num: 3,
      id: "intro",
      icon: <Mic size={24} />,
      title: "Self-Introduction Audio Test",
      desc: "Record your intro. AI will score your fluency and required technical keywords.",
      href: "/intro",
      status: hasPassedIntro ? "completed" : (hasCaseStudy ? "pending" : "locked"),
      btnText: hasPassedIntro ? "Retake Intro" : "Record Intro",
    },
    {
      num: 4,
      id: "interviews",
      icon: <Video size={24} />,
      title: "Practice Mock Interviews",
      desc: "Face challenging AI agents using your generated case study context.",
      href: "/interview",
      status: hasPassedIntro ? "pending" : "locked",
      btnText: "Start Interviews",
    }
  ];

  if (loading) {
     return (
       <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: "4px solid rgba(139,92,246,0.2)", borderTopColor: "var(--accent-light)", borderRadius: "50%" }}></div>
       </div>
     );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
      <Navbar candidateName={candidateName} onLogout={handleLogout} />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="badge badge-accent" style={{ display: "inline-flex", marginBottom: 16 }}>
             Candidate Progress Journey
          </div>
          <h1 style={{ fontSize: 36, marginBottom: 16 }}>
            Your <span className="glow-text">Pipeline Tracker</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
            Follow the sequential path. You must complete each step successfully to unlock the next and prove your readiness.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
           {/* Connecting vertical line */}
           <div style={{
              position: "absolute", left: 34, top: 40, bottom: 40, width: 2,
              background: "rgba(255,255,255,0.05)", zIndex: 0
           }}></div>

           {steps.map((step, i) => {
              const isLocked = step.status === "locked";
              const isCompleted = step.status === "completed";
              const isPending = step.status === "pending";

              return (
                 <div key={step.id} style={{
                    display: "flex", gap: 20, position: "relative", zIndex: 1, opacity: isLocked ? 0.5 : 1, transition: "opacity 0.3s"
                 }}>
                    
                    {/* Status Circle */}
                    <div style={{
                       width: 70, height: 70, borderRadius: "50%", flexShrink: 0,
                       background: isCompleted ? "rgba(16,185,129,0.15)" : isPending ? "var(--bg-card)" : "rgba(255,255,255,0.03)",
                       border: `2px solid ${isCompleted ? "var(--success)" : isPending ? "var(--accent-light)" : "var(--border)"}`,
                       display: "flex", alignItems: "center", justifyContent: "center",
                       color: isCompleted ? "var(--success)" : isPending ? "var(--accent-light)" : "var(--text-muted)",
                       boxShadow: isPending ? "0 0 20px rgba(139,92,246,0.2)" : "none",
                    }}>
                       {isCompleted ? <CheckCircle size={32} /> : isLocked ? <Lock size={28} /> : step.icon}
                    </div>

                    {/* Step Content Card */}
                    <div className={`card ${isPending ? 'glow-purple' : ''}`} style={{
                       flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 16,
                       border: isPending ? "1px solid rgba(139,92,246,0.3)" : "1px solid var(--border)",
                    }}>
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                             <span style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px", color: isCompleted ? "var(--success)" : "var(--accent-light)", marginBottom: 8, display: "block" }}>
                                {isCompleted ? "Passed" : isLocked ? "Locked" : "Next Up"}
                             </span>
                             <h3 style={{ fontSize: 22, color: "var(--text-primary)" }}>
                                Step {step.num}: {step.title}
                             </h3>
                          </div>
                       </div>
                       
                       <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
                         {step.desc}
                       </p>
                       
                       <div style={{ marginTop: "auto", paddingTop: 8 }}>
                          {isLocked ? (
                             <button className="btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                Complete previous steps to unlock
                             </button>
                          ) : (
                             <Link href={step.href}>
                               <button className={isPending ? "btn-primary" : "btn-secondary"} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
                                  {step.btnText} {isPending && <ArrowRight size={16} />}
                               </button>
                             </Link>
                          )}
                       </div>
                    </div>

                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
