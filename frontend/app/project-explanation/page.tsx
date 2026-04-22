// // C:\Users\dhira\OneDrive\Desktop\AI prep tool\AI Mock tool, Intro video tool\frontend\app\project-explanation\page.tsx
// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { evaluateProjectExplanation, generateFromUseCase } from "@/lib/api";
// import Link from "next/link";
// import { ChevronLeft, Sparkles, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
// import toast from "react-hot-toast";
// import ReactMarkdown from "react-markdown";

// export default function ProjectExplanationPage() {
//   const router = useRouter();
//   const [sessionId, setSessionId] = useState("");
  
//   // UI Step Logic
//   const [step, setStep] = useState<"fill" | "evaluate" | "case_study">("fill");

//   // Domain Fields
//   const [product, setProduct] = useState("");
//   const [architecture, setArchitecture] = useState("");
//   const [businessValue, setBusinessValue] = useState("");
//   const [role, setRole] = useState("");
//   const [impact, setImpact] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [evaluation, setEvaluation] = useState<any>(null);
//   const [generatedCaseStudy, setGeneratedCaseStudy] = useState<string | null>(null);

//   useEffect(() => {
//     const sid = localStorage.getItem("session_id");
//     if (!sid) { router.push("/setup"); return; }
//     setSessionId(sid);
//     const fetchContext = async () => {
//       try {
//         const res = await fetch(`http://localhost:8000/api/context/${sid}`);
//         if(res.ok) {
//            const data = await res.json();
//            if(data.project && data.project.product) {
//               setProduct(data.project.product);
//               setArchitecture(data.project.architecture);
//               setBusinessValue(data.project.business_value);
//               setRole(data.project.role);
//               setImpact(data.project.impact);
//            }
//         }
//       } catch(e) {}
//     };
//     fetchContext();
//   }, [router]);

//   const submitProject = async () => {
//     if (!product || !architecture || !businessValue || !role || !impact) {
//       toast.error("Please fill out all fields deeply.");
//       return;
//     }
    
//     setLoading(true);
//     setEvaluation(null);
//     try {
//       const apiKey = localStorage.getItem("openai_key") || "";
//       const res = await fetch(`http://localhost:8000/api/project/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ user_id: sessionId, product, architecture, business_value: businessValue, role, impact, api_key: apiKey })
//       });
//       if(!res.ok) throw new Error("Evaluation failed");
//       const data = await res.json();
      
//       setEvaluation(data.evaluation);
//       setGeneratedCaseStudy(data.case_study);
      
//       if (data.evaluation.overall_score >= 7) {
//         toast.success(`Great job! Score: ${data.evaluation.overall_score}/10`);
//         setStep("case_study");
//       } else {
//         toast.error(`Score: ${data.evaluation.overall_score}/10. Needs more details.`);
//         setStep("evaluate");
//       }
//     } catch (error: any) {
//       toast.error("Process failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
//       {/* Navbar */}
//       <nav style={{
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//         padding: "20px 48px", borderBottom: "1px solid var(--border)",
//       }}>
//         <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
//           <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <img src="/logo.png" alt="WBL Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
//           </div>
//           <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
//             WBL <span style={{ color: "var(--accent-light)" }}>PrepHub</span>
//           </span>
//         </Link>
//         <Link href="/dashboard">
//           <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
//             <ChevronLeft size={14} /> Dashboard
//           </button>
//         </Link>
//       </nav>

//       <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        
//         <div style={{ textAlign: "center", marginBottom: 40 }}>
//           <div className="badge badge-accent" style={{ display: "inline-flex", marginBottom: 16 }}>
//             <Sparkles size={14} style={{ marginRight: 6 }} /> Interactive Builder
//           </div>
//           <h1 style={{ fontSize: 36, marginBottom: 16 }}>
//             Project <span className="glow-text">Explanation</span>
//           </h1>
//           <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
//             Before AI creates your case study, you must successfully explain your core project.<br/>
//             AI will review it for completeness (Problem, Solution, Value, Impact, Role).
//           </p>
//         </div>

//         {/* Form Input fields */}
//         {step !== "case_study" && (
//           <div className="card" style={{ padding: 32, marginBottom: 24 }}>
//             <h2 style={{ fontSize: 20, marginBottom: 24, gap: 8 }}>
//                Explain Your Core Project
//             </h2>

//             <label className="label">Product / Mission</label>
//             <input className="input-field" style={{marginBottom:16}} value={product} onChange={e => setProduct(e.target.value)} placeholder="What was it?" />

//             <label className="label">Architecture & Tech Stack</label>
//             <textarea className="input-field" rows={3} style={{marginBottom:16}} value={architecture} onChange={e => setArchitecture(e.target.value)} placeholder="How was it built?" />

//             <label className="label">Business Value</label>
//             <textarea className="input-field" rows={2} style={{marginBottom:16}} value={businessValue} onChange={e => setBusinessValue(e.target.value)} placeholder="Why did it matter?" />

//             <label className="label">Your Role & Ownership</label>
//             <input className="input-field" style={{marginBottom:16}} value={role} onChange={e => setRole(e.target.value)} placeholder="Lead Dev, Data Engineer, etc." />

//             <label className="label">Metrics & Impact</label>
//             <input className="input-field" style={{marginBottom:24}} value={impact} onChange={e => setImpact(e.target.value)} placeholder="Reduced latency by 40%..." />

//             <button className="btn-primary" onClick={submitProject} disabled={loading} style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8 }}>
//               {loading ? "Analyzing & Generating..." : "Evaluate & Create Case Study"}
//             </button>
//           </div>
//         )}

//         {/* Evaluation Output */}
//         {evaluation && step !== "case_study" && (
//           <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
//             <h4 style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
//               <AlertCircle size={16} /> Needs Improvement (Score: {evaluation.overall_score}/10)
//             </h4>
//             <div style={{ color: "var(--text-primary)", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
//               {evaluation.feedback && evaluation.feedback.map((f:any, i:number) => <p key={i}>- {f}</p>)}
//             </div>
//           </div>
//         )}

//         {/* Generated output */}
//         {step === "case_study" && generatedCaseStudy && (
//             <div className="card animate-fadeIn" style={{ padding: 32, borderColor: "var(--success)" }}>
//                <h2 style={{ fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
//                  <CheckCircle size={20} color="var(--success)" /> Study Guide Generated
//                </h2>
//                <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
//                  The AI has customized the backend templates using your explicit project and use case details. Review it, then proceed.
//                </p>
//                <div style={{ background: "rgba(0,0,0,0.2)", padding: 24, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24, maxHeight: 500, overflowY: "auto" }}>
//                  <div className="prose prose-invert max-w-none">
//                     <ReactMarkdown>{generatedCaseStudy}</ReactMarkdown>
//                  </div>
//                </div>
               
//                <button 
//                 className="btn-primary" 
//                 onClick={() => router.push("/intro")}
//                 style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8, background: "var(--success)" }}
//               >
//                 Proceed to Intro Evaluation <ArrowRight size={18} />
//               </button>
//             </div>
//         )}

//       </div>
//     </div>
//   );
// }


// frontend\app\project-explanation\page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import { evaluateProjectExplanation, generateFromUseCase } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, Sparkles, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function ProjectExplanationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  
  // UI Step Logic
  const [step, setStep] = useState<"fill" | "evaluate" | "case_study">("fill");

  // Domain Fields
  const [product, setProduct] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [role, setRole] = useState("");
  const [impact, setImpact] = useState("");

  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState<string | null>(null);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) { router.push("/setup"); return; }
    setSessionId(sid);
    const fetchContext = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/context/${sid}`);
        if(res.ok) {
           const data = await res.json();
           if(data.project && data.project.product) {
              setProduct(data.project.product);
              setArchitecture(data.project.architecture);
              setBusinessValue(data.project.business_value);
              setRole(data.project.role);
              setImpact(data.project.impact);
           }
        }
      } catch(e) {}
    };
    fetchContext();
  }, [router]);

  const submitProject = async () => {
    if (!product || !architecture || !businessValue || !role || !impact) {
      toast.error("Please fill out all fields deeply.");
      return;
    }
    
    setLoading(true);
    setEvaluation(null);

    try {
      const res = await fetch(`http://localhost:8000/api/project/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: sessionId,
          product,
          architecture,
          business_value: businessValue,
          role,
          impact
          // ✅ api_key removed
        })
      });

      if(!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      
      setEvaluation(data.evaluation);
      setGeneratedCaseStudy(data.case_study);
      
      if (data.evaluation.overall_score >= 7) {
        toast.success(`Great job! Score: ${data.evaluation.overall_score}/10`);
        setStep("case_study");
      } else {
        toast.error(`Score: ${data.evaluation.overall_score}/10. Needs more details.`);
        setStep("evaluate");
      }
    } catch (error: any) {
      toast.error("Process failed.");
    } finally {
      setLoading(false);
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

        {/* Form Input fields */}
        {step !== "case_study" && (
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 24, gap: 8 }}>
               Explain Your Core Project
            </h2>

            <label className="label">Product / Mission</label>
            <input className="input-field" style={{marginBottom:16}} value={product} onChange={e => setProduct(e.target.value)} placeholder="What was it?" />

            <label className="label">Architecture & Tech Stack</label>
            <textarea className="input-field" rows={3} style={{marginBottom:16}} value={architecture} onChange={e => setArchitecture(e.target.value)} placeholder="How was it built?" />

            <label className="label">Business Value</label>
            <textarea className="input-field" rows={2} style={{marginBottom:16}} value={businessValue} onChange={e => setBusinessValue(e.target.value)} placeholder="Why did it matter?" />

            <label className="label">Your Role & Ownership</label>
            <input className="input-field" style={{marginBottom:16}} value={role} onChange={e => setRole(e.target.value)} placeholder="Lead Dev, Data Engineer, etc." />

            <label className="label">Metrics & Impact</label>
            <input className="input-field" style={{marginBottom:24}} value={impact} onChange={e => setImpact(e.target.value)} placeholder="Reduced latency by 40%..." />

            <button className="btn-primary" onClick={submitProject} disabled={loading} style={{ width: "100%", padding: "12px 0", display: "flex", justifyContent: "center", gap: 8 }}>
              {loading ? "Analyzing & Generating..." : "Evaluate & Create Case Study"}
            </button>
          </div>
        )}

        {/* Evaluation Output */}
        {evaluation && step !== "case_study" && (
          <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
            <h4 style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <AlertCircle size={16} /> Needs Improvement (Score: {evaluation.overall_score}/10)
            </h4>
            <div style={{ color: "var(--text-primary)", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              {evaluation.feedback && evaluation.feedback.map((f:any, i:number) => <p key={i}>- {f}</p>)}
            </div>
          </div>
        )}

        {/* Generated output */}
        {step === "case_study" && generatedCaseStudy && (
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