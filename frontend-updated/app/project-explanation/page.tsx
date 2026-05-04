"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { evaluateProjectExplanation, generateFromUseCase } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, Sparkles, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";

export default function ProjectExplanationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  
  const [step, setStep] = useState<"fill" | "evaluate" | "case_study">("fill");

  const [domain, setDomain] = useState("");
  const [background, setBackground] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [product, setProduct] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [role, setRole] = useState("");
  const [impact, setImpact] = useState("");

  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(true);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState<string | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const generateSpecificCaseStudy = async (templateKey: string) => {
      setGeneratingTemplate(true);
      try {
          const { generateCaseStudyFromTemplate } = await import("@/lib/api");
          const projectDetails = `Product: ${product}\nArchitecture: ${architecture}\nRole: ${role}\nImpact: ${impact}\nBusiness Value: ${businessValue}\nBackground: ${background}\nDomain: ${domain}\nSkills: ${skills.join(", ")}`;
          const res = await generateCaseStudyFromTemplate(sessionId, projectDetails, templateKey);
          setGeneratedCaseStudy(res.content);
          toast.success(`Generated ${templateKey.toUpperCase()} Study Guide`);
      } catch(e: any) {
          toast.error("Failed to generate case study.");
      } finally {
          setGeneratingTemplate(false);
      }
  };

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) { router.push("/setup"); return; }
    setSessionId(sid);
    setCandidateName(localStorage.getItem("candidate_name") || "");
    const fetchContext = async () => {
      try {
        setLoading(true);
        const { extractProject, getCaseStudyHistory } = await import("@/lib/api");

        // Check if case study already generated
        try {
          const csHist = await getCaseStudyHistory(sid);
          if (csHist.case_studies && csHist.case_studies.length > 0) {
            const content = csHist.case_studies[0].content;
            if (content) {
              setGeneratedCaseStudy(content);
              setStep("case_study");
            }
          }
        } catch(e) {}

        const extracted = await extractProject(sid);
        if (extracted) {
           setDomain(extracted.domain || "");
           setBackground(extracted.background || "");
           setSkills(extracted.skills || []);
           if (extracted.core_project) {
              setProduct(extracted.core_project.product || "");
              setArchitecture(extracted.core_project.architecture || "");
              setBusinessValue(extracted.core_project.business_value || "");
              setRole(extracted.core_project.role || "");
              setImpact(extracted.core_project.impact || "");
           }
        }
      } catch(e: any) {
        const errorMsg = e?.response?.data?.detail || e?.message || "Failed to extract data from resume. Make sure you uploaded one.";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
        setIsExtracting(false);
      }
    };
    fetchContext();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("session_id");
    router.push("/");
  };

  const submitProject = async () => {
    if (!product || !architecture || !businessValue || !role || !impact) {
      toast.error("Please fill out all fields");
      return;
    }
    
    setLoading(true);
    setEvaluation(null);
    try {
      const apiKey = localStorage.getItem("openai_key") || "";
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "https://ai-backend-560359652969.us-central1.run.app" : "http://127.0.0.1:8000");
      const res = await fetch(`${backendUrl}/api/project/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: sessionId, 
          product, 
          architecture, 
          business_value: businessValue, 
          role, 
          impact, 
          api_key: apiKey,
          domain,
          background,
          skills
        })
      });
      if(!res.ok) {
        let errDetail = "Evaluation failed";
        try {
          const errData = await res.json();
          if(errData && errData.detail) errDetail = errData.detail;
        } catch(parrErr) {}
        throw new Error(errDetail);
      }
      
      const data = await res.json();
      
      setEvaluation(data.evaluation);
      // We no longer set the generic case study here so the user sees the domain buttons.
      
      if (data.evaluation.overall_score >= 7) {
        toast.success(`Excellent! Score: ${data.evaluation.overall_score}/10. Please choose a domain.`);
        setStep("case_study");
      } else {
        toast.error(`Score: ${data.evaluation.overall_score}/10. Please add more details.`);
        setStep("evaluate");
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Process failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Navbar candidateName={candidateName} onLogout={handleLogout} />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="badge badge-accent" style={{ display: "inline-flex", marginBottom: 16 }}>
            <Sparkles size={14} style={{ marginRight: 6 }} /> Interactive Builder
          </div>
          <h1 style={{
            fontSize: 36,
            marginBottom: 16,
            color: "var(--text-primary)",
            fontWeight: 700,
          }}>
            Explain Your <span className="glow-text">Project</span>
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: 15,
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            Describe your core project in detail. The AI will evaluate completeness and generate a case study if ready.
          </p>
        </div>

        {/* Form Input fields */}
        {step !== "case_study" && (
          <div className="card animate-fadeIn" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{
              fontSize: 20,
              marginBottom: 8,
              color: "var(--text-primary)",
              fontWeight: 700,
            }}>
               Extracted Candidate Profile
            </h2>
            
            {isExtracting ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", background: "rgba(79, 70, 229, 0.1)", borderRadius: 8, marginBottom: 24, border: "1px solid rgba(79, 70, 229, 0.2)" }}>
                 <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                 <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: 14 }}>Please wait while your data is getting extracted and loaded...</p>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
                The AI automatically extracted your domain, background, skills, and core project from your resume. Review and edit if needed before generating your case study.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Domain</label>
                <input
                  className="input-field"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Background</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  placeholder="Summary of experience"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Skills</label>
                <input
                  className="input-field"
                  value={Array.isArray(skills) ? skills.join(", ") : skills || ""}
                  onChange={e => {
                    const val = e.target.value;
                    setSkills(val ? val.split(",").map(s => s.trim()) : []);
                  }}
                  placeholder="React, Python, AWS..."
                  disabled={loading}
                />
              </div>

              <hr style={{ borderColor: "var(--border)", margin: "8px 0" }} />

              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "8px 0" }}>Core Project Details</h3>

              <div>
                <label className="label">Product / Mission</label>
                <input
                  className="input-field"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  placeholder="What was the product or project?"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Architecture & Tech Stack</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={architecture}
                  onChange={e => setArchitecture(e.target.value)}
                  placeholder="Describe the architecture and technologies used..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Business Value</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={businessValue}
                  onChange={e => setBusinessValue(e.target.value)}
                  placeholder="Why did this project matter? What problem did it solve?"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Your Role & Ownership</label>
                <input
                  className="input-field"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Lead Developer, Data Engineer, Product Manager..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Metrics & Impact</label>
                <input
                  className="input-field"
                  style={{marginBottom:24}}
                  value={impact}
                  onChange={e => setImpact(e.target.value)}
                  placeholder="e.g. Reduced latency by 40%, Improved user retention by 25%..."
                  disabled={loading}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={submitProject}
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 0",
                display: "flex",
                justifyContent: "center",
                gap: 8,
                fontSize: 14,
              }}
            >
              {loading ? "Extracting / Evaluating..." : "Evaluate & Generate Case Study"}
            </button>
          </div>
        )}

        {/* Evaluation Output */}
        {evaluation && step !== "case_study" && (
          <div style={{
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.2)",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <h4 style={{
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}>
              <AlertCircle size={16} /> Needs More Detail
            </h4>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginBottom: 12,
              fontWeight: 500,
            }}>
              Score: {evaluation.overall_score}/10
            </p>
            <div style={{
              color: "var(--text-primary)",
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              {evaluation.feedback && evaluation.feedback.map((f:any, i:number) => (
                <p key={i} style={{ marginBottom: 6 }}>• {f}</p>
              ))}
            </div>
          </div>
        )}

        {/* Generated output */}
        {step === "case_study" && (
            <div className="card animate-fadeIn" style={{
              padding: 32,
              borderColor: "rgba(5, 150, 105, 0.3)",
              border: "1px solid rgba(5, 150, 105, 0.3)",
              background: "linear-gradient(135deg, rgba(5, 150, 105, 0.02) 0%, rgba(5, 150, 105, 0) 100%)",
            }}>
               <h2 style={{
                 fontSize: 20,
                 marginBottom: 16,
                 display: "flex",
                 alignItems: "center",
                 gap: 8,
                 color: "var(--text-primary)",
                 fontWeight: 700,
               }}>
                 <CheckCircle size={20} color="var(--success)" /> Project Context Saved
               </h2>
               <p style={{
                 color: "var(--text-secondary)",
                 marginBottom: 24,
                 fontSize: 14,
                 lineHeight: 1.6,
                 fontWeight: 400,
               }}>
                 Generate a deep, FAANG-level study guide tailored to a specific domain using your background.
               </p>

               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
                  <button onClick={() => generateSpecificCaseStudy("rag")} className="btn-secondary" disabled={generatingTemplate} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>RAG</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>Retrieval-Augmented Gen</span>
                  </button>
                  <button onClick={() => generateSpecificCaseStudy("mlops")} className="btn-secondary" disabled={generatingTemplate} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fb923c" }}>MLOps</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>Pipelines & Serving</span>
                  </button>
                  <button onClick={() => generateSpecificCaseStudy("agentic")} className="btn-secondary" disabled={generatingTemplate} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#e879f9" }}>Agentic AI</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>Multi-Agent Orchestration</span>
                  </button>
               </div>

               {generatingTemplate && (
                 <div style={{ display: "flex", justifyContent: "center", padding: 24, marginBottom: 24 }}>
                   <div className="animate-spin" style={{ width: 32, height: 32, border: "3px solid var(--bg-tertiary)", borderTopColor: "var(--accent)", borderRadius: "50%" }}></div>
                 </div>
               )}

               {!generatingTemplate && generatedCaseStudy && (
                 <div style={{
                   background: "var(--bg-secondary)",
                   padding: 24,
                   borderRadius: 12,
                   border: "1px solid var(--border)",
                   marginBottom: 24,
                   maxHeight: 500,
                   overflowY: "auto",
                 }}>
                   <div className="prose-dark">
                      <ReactMarkdown>{generatedCaseStudy}</ReactMarkdown>
                   </div>
                 </div>
               )}
               
               <button 
                className="btn-primary" 
                onClick={() => router.push("/intro")}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                Continue to Intro Test <ArrowRight size={16} />
              </button>
            </div>
        )}

      </div>
    </div>
  );
}
