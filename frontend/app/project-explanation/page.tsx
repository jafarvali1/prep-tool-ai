"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { evaluateProjectExplanation, generateFromUseCase } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, Sparkles, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function ProjectExplanationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  
  // Step 1 State
  const [explanation, setExplanation] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null); // {score, missing_elements, feedback}
  const [step1Passed, setStep1Passed] = useState(false);

  // Step 2 State
  const [useCaseDetails, setUseCaseDetails] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState<string | null>(null);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) { router.push("/setup"); return; }
    setSessionId(sid);
  }, [router]);

  const handleEvaluate = async () => {
    if (explanation.trim().length < 20) {
      toast.error("Please provide a more detailed explanation.");
      return;
    }
    
    setEvalLoading(true);
    setEvaluation(null);
    try {
      const result = await evaluateProjectExplanation(sessionId, explanation);
      setEvaluation(result);
      if (result.score >= 4) {
        setStep1Passed(true);
        toast.success(`Great job! Score: ${result.score}/5`);
      } else {
        setStep1Passed(false);
        toast.error(`Score: ${result.score}/5. Needs more details.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Evaluation failed");
    } finally {
      setEvalLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (useCaseDetails.trim().length < 20) {
      toast.error("Please provide deeper use-case details.");
      return;
    }

    setGenerating(true);
    try {
      const resp = await generateFromUseCase(sessionId, explanation, useCaseDetails);
      setGeneratedCaseStudy(resp.content);
      toast.success("Case Study Generated!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px", borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logo.png" alt="WBL Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
            WBL <span style={{ color: "var(--accent-light)" }}>PrepHub</span>
          </span>
        </Link>
        <Link href="/dashboard">
          <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
            <ChevronLeft size={14} /> Dashboard
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="badge badge-accent" style={{ display: "inline-flex", marginBottom: 16 }}>
            <Sparkles size={14} style={{ marginRight: 6 }} /> Interactive Builder
          </div>
          <h1 style={{ fontSize: 36, marginBottom: 16 }}>
            Project <span className="glow-text">Explanation</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
            Before AI creates your case study, you must successfully explain your core project.<br/>
            AI will review it for completeness (Problem, Solution, Value, Impact, Role).
          </p>
        </div>

        {/* Step 1: Project Explanation */}
        <div className={`card ${step1Passed ? 'border-success' : ''}`} style={{ padding: 32, marginBottom: 24, transition: "all 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
              Step 1: Explain Your Project
              {step1Passed && <CheckCircle size={20} color="var(--success)" />}
            </h2>
            {evaluation && (
              <div className={`badge ${step1Passed ? 'badge-success' : 'badge-warning'}`}>
                Score: {evaluation.score} / 5
              </div>
            )}
          </div>

          <label className="label" style={{ marginBottom: 12 }}>
            Describe your project covering: Problem Solved, Solution/Architecture, Business Value, Users, and Your Role.
          </label>
          <textarea
            className="input-field"
            rows={8}
            placeholder="I built X to solve Y. The architecture used Z. My role was..."
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              setStep1Passed(false);
              setEvaluation(null);
            }}
            disabled={evalLoading || generating}
            style={{ marginBottom: 20 }}
          />

          {evaluation && !step1Passed && (
            <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <h4 style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <AlertCircle size={16} /> Needs Improvement
              </h4>
              <p style={{ color: "var(--text-primary)", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
                {evaluation.feedback}
              </p>
              {evaluation.missing_elements && evaluation.missing_elements.length > 0 && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  <strong>Missing Elements:</strong>
                  <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                    {evaluation.missing_elements.map((el: string, i: number) => <li key={i}>{el}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!step1Passed && (
            <button 
              className="btn-primary" 
              onClick={handleEvaluate} 
              disabled={evalLoading || explanation.trim() === ""}
              style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8 }}
            >
              {evalLoading ? <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }}></div> : <Sparkles size={16} />}
              {evalLoading ? "Analyzing..." : "Evaluate Explanation"}
            </button>
          )}
        </div>

        {/* Step 2: Use Case Level */}
        {step1Passed && !generatedCaseStudy && (
          <div className="card animate-fadeIn" style={{ padding: 32, borderColor: "var(--accent)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 24 }}>Step 2: Deep Dive Use Case</h2>
            
            <label className="label" style={{ marginBottom: 12 }}>
              Give a real use-case scenario. Be specific: What data/corpus was used? Example queries? Step-by-step workflow?
            </label>
            <textarea
              className="input-field"
              rows={6}
              placeholder="Example: When a recruiter uploads a technical JD for a React role, the system queries the parsed resumes vector DB..."
              value={useCaseDetails}
              onChange={(e) => setUseCaseDetails(e.target.value)}
              disabled={generating}
              style={{ marginBottom: 24 }}
            />

            <button 
              className="btn-primary" 
              onClick={handleGenerate} 
              disabled={generating || useCaseDetails.trim() === ""}
              style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8 }}
            >
              {generating ? <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }}></div> : <Sparkles size={16} />}
              {generating ? "Crafting Case Study..." : "Generate Final Case Study"}
            </button>
          </div>
        )}

        {/* Step 3: View Generated Case Study */}
        {generatedCaseStudy && (
            <div className="card animate-fadeIn" style={{ padding: 32, borderColor: "var(--success)" }}>
               <h2 style={{ fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                 <CheckCircle size={20} color="var(--success)" /> Study Guide Generated
               </h2>
               <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
                 The AI has customized the backend templates using your explicit project and use case details. Review it, then proceed.
               </p>
               <div style={{ background: "rgba(0,0,0,0.2)", padding: 24, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24, maxHeight: 500, overflowY: "auto" }}>
                 <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{generatedCaseStudy}</ReactMarkdown>
                 </div>
               </div>
               
               <button 
                className="btn-primary" 
                onClick={() => router.push("/intro")}
                style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8, background: "var(--success)" }}
              >
                Proceed to Intro Evaluation <ArrowRight size={18} />
              </button>
            </div>
        )}

      </div>
    </div>
  );
}
