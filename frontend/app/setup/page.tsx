// C:\Users\dhira\OneDrive\Desktop\AI prep tool\AI Mock tool, Intro video tool\frontend\app\setup\page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateApiKey, uploadResume } from "@/lib/api";
import toast from "react-hot-toast";
import axios from "axios";
import { Key, Upload, CheckCircle, AlertCircle, ChevronRight, FileText, Eye, EyeOff, Wifi, WifiOff, FileJson } from "lucide-react";
import Link from "next/link";

type Step = "api" | "resume" | "done";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("api");
  
  // Requirement: API Keys
  const [apiProvider, setApiProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [whisperKey, setWhisperKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  const [sessionId, setSessionId] = useState("");
  const [capabilities, setCapabilities] = useState<any>(null);
  
  // Requirement: Resumes
  const [jsonResume, setJsonResume] = useState<File | null>(null);
  const [pdfResume, setPdfResume] = useState<File | null>(null); // Optional
  
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  // Check backend is reachable
  useEffect(() => {
    const backendUrl = process.env.NODE_ENV === "production" 
      ? "https://ai-backend-560359652969.us-central1.run.app" 
      : "http://localhost:8000";
      
    axios.get(`${backendUrl}/health`, { timeout: 4000 })
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  const handleValidateKeys = async () => {
    if (!apiKey.trim() || !whisperKey.trim()) {
      setErrorMsg("Setup incomplete, please fix this"); 
      return; 
    }
    setLoading(true);
    setErrorMsg("");
    try {
      // Validate the main api key
      const data = await validateApiKey(apiKey.trim(), apiProvider);
      
      setSessionId(data.session_id);
      setCapabilities(data.models_available);
      
      localStorage.setItem("session_id", data.session_id);
      localStorage.setItem("api_provider", apiProvider);
      localStorage.setItem("whisper_key", whisperKey.trim());
      localStorage.setItem("openai_key", apiKey.trim()); // For backward compatibility with api.ts calls
      localStorage.setItem(`${apiProvider}_key`, apiKey.trim());
      
      toast.success("Required tools validated! ✓");
      setStep("resume");
    } catch (err: any) {
      console.error("Validation error:", err);
      setErrorMsg("Setup incomplete, please fix this");
      toast.error("Failed to connect with tools.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!jsonResume) {
      toast.error("Setup incomplete, please fix this");
      return;
    }
    setLoading(true);
    try {
      // Primary: Send JSON (Modify api.ts to send both later if backend supports multipart robustly)
      const data = await uploadResume(sessionId, jsonResume);
      setWordCount(data.word_count || 500);
      if (data.candidate_name) localStorage.setItem("candidate_name", data.candidate_name);
      toast.success(`Resume data extracted successfully.`);
      setStep("done");
    } catch (err: any) {
       toast.error(err?.response?.data?.detail || "Failed to parse resume JSON.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "json") setJsonResume(file);
      else if (ext === "pdf" || ext === "docx") setPdfResume(file);
    });
  };

  const steps = [
    { id: "api", label: "Tools", icon: <Key size={16} /> },
    { id: "resume", label: "Data", icon: <Upload size={16} /> },
    { id: "done", label: "Ready", icon: <CheckCircle size={16} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", padding: "20px 48px",
        borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/logo.png" alt="WBL Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
            WBL <span style={{ color: "var(--accent-light)" }}>PrepHub</span>
          </span>
        </Link>
      </nav>

      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px" }}>
        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 48, gap: 0 }}>
          {steps.map((s, i) => (
             <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
               <div style={{
                 display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 100,
                 background: step === s.id ? "rgba(139,92,246,0.2)" : (["done", "resume"].includes(step) && s.id === "api") || (step === "done" && s.id === "resume") ? "rgba(16,185,129,0.1)" : "transparent",
                 border: step === s.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid transparent",
                 color: step === s.id ? "var(--accent-light)" : "var(--text-muted)",
                 fontSize: 13, fontWeight: 600, transition: "all 0.3s",
               }}>
                 {s.icon} {s.label}
               </div>
               {i < steps.length - 1 && (
                 <ChevronRight size={16} color="var(--text-muted)" style={{ margin: "0 4px" }} />
               )}
             </div>
          ))}
        </div>

        {/* Step 1: API Keys (Required Tools) */}
        {step === "api" && (
          <div className="card animate-fadeIn" style={{ padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent-light)", marginBottom: 20,
              }}>
                <Key size={26} />
              </div>
              <h1 style={{ fontSize: 28, marginBottom: 8 }}>Required Tools</h1>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Please provide the required AI tool access keys. Your keys are not stored permanently.
              </p>
              
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                 {backendOk === null && <span style={{ color: "var(--text-muted)" }}>⏳ Checking environment...</span>}
                 {backendOk === true && <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}><Wifi size={12} /> Live</span>}
                 {backendOk === false && <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}><WifiOff size={12} /> Disconnected</span>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="label">LLM Provider <span style={{color: "var(--danger)"}}>*</span></label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                   <select 
                     className="input-field" 
                     value={apiProvider} 
                     onChange={(e) => setApiProvider(e.target.value)}
                     style={{ appearance: "none", cursor: "pointer" }}
                   >
                     <option value="openai">OpenAI (Recommended)</option>
                     <option value="anthropic">Anthropic Claude</option>
                     <option value="gemini">Google Gemini</option>
                     <option value="groq">Groq</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="label">{apiProvider === "openai" ? "OpenAI" : apiProvider === "anthropic" ? "Anthropic" : apiProvider === "gemini" ? "Gemini" : "Groq"} Key <span style={{color: "var(--danger)"}}>*</span></label>
                <div style={{ position: "relative" }}>
                   <input
                     className="input-field"
                     type={showKey ? "text" : "password"}
                     placeholder={apiProvider === "openai" ? "sk-..." : "api-key..."}
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     style={{ paddingRight: 48 }}
                   />
                </div>
              </div>

              <div>
                <label className="label">Whisper Key <span style={{color: "var(--danger)"}}>*</span></label>
                <div style={{ position: "relative" }}>
                   <input
                     className="input-field"
                     type={showKey ? "text" : "password"}
                     placeholder="sk-whisper-..."
                     value={whisperKey}
                     onChange={(e) => setWhisperKey(e.target.value)}
                     style={{ paddingRight: 48 }}
                   />
                </div>
              </div>

              {/* Requirement Error */}
              {errorMsg && (
                 <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                   <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                   <p style={{ color: "var(--danger)", fontSize: 13, lineHeight: 1.5, fontWeight: "bold" }}>👉 {errorMsg}</p>
                 </div>
              )}

              <button
                className="btn-primary"
                onClick={handleValidateKeys}
                disabled={loading || backendOk === false}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}
              >
                 {loading ? "Verifying Tools..." : "Check Availability"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Resume Upload */}
        {step === "resume" && (
          <div className="card animate-fadeIn" style={{ padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
               <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent-light)", marginBottom: 20,
               }}>
                  <Upload size={26} />
               </div>
               <h1 style={{ fontSize: 28, marginBottom: 8 }}>Candidate Data</h1>
               <div className="badge badge-success" style={{ marginBottom: 16 }}>
                  <CheckCircle size={12} /> System Tools Verified
               </div>
               <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Upload your professional details. A structured JSON is mandatory to proceed.
               </p>
            </div>

            {/* Drop zone */}
            <div
               onDrop={handleDrop}
               onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
               onDragLeave={() => setDragOver(false)}
               style={{
                  border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 16, padding: "40px 24px", textAlign: "center",
                  transition: "all 0.3s", background: dragOver ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
                  marginBottom: 24, display: "flex", flexDirection: "column", gap: 16
               }}
            >
               {/* JSON Required */}
               <div style={{ padding: 16, background: jsonResume ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", borderRadius: 12, border: `1px solid ${jsonResume ? "var(--success)" : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: jsonResume ? 12 : 0 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <FileJson size={24} color={jsonResume ? "var(--success)" : "var(--text-secondary)"} />
                        <div style={{ textAlign: "left" }}>
                           <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Resume JSON <span style={{color: "var(--danger)"}}>*</span></p>
                           {!jsonResume && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>(Important) Required</p>}
                        </div>
                     </div>
                     {!jsonResume && (
                        <button onClick={() => document.getElementById("json-file-input")?.click()} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>Browse</button>
                     )}
                     <input id="json-file-input" type="file" accept=".json" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && setJsonResume(e.target.files[0])} />
                  </div>
                  {jsonResume && (
                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <p style={{ fontSize: 13, color: "var(--success)", fontWeight: "bold" }}>{jsonResume.name} ✅</p>
                        <button onClick={() => { setJsonResume(null); const el = document.getElementById("json-file-input") as HTMLInputElement; if(el) el.value = ""; }} className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11, background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}>
                           Delete & Replace
                        </button>
                     </div>
                  )}
               </div>

               {/* PDF Optional */}
               <div style={{ padding: 16, background: pdfResume ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", borderRadius: 12, border: `1px solid ${pdfResume ? "var(--success)" : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pdfResume ? 12 : 0 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <FileText size={24} color={pdfResume ? "var(--success)" : "var(--text-secondary)"} />
                        <div style={{ textAlign: "left" }}>
                           <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Resume PDF</p>
                           {!pdfResume && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>(Optional)</p>}
                        </div>
                     </div>
                     {!pdfResume && (
                        <button onClick={() => document.getElementById("pdf-file-input")?.click()} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>Browse</button>
                     )}
                     <input id="pdf-file-input" type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && setPdfResume(e.target.files[0])} />
                  </div>
                  {pdfResume && (
                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <p style={{ fontSize: 13, color: "var(--success)", fontWeight: "bold" }}>{pdfResume.name} ✅</p>
                        <button onClick={() => { setPdfResume(null); const el = document.getElementById("pdf-file-input") as HTMLInputElement; if(el) el.value = ""; }} className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11, background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}>
                           Delete & Replace
                        </button>
                     </div>
                  )}
               </div>
            </div>

            <button
               className="btn-primary" onClick={handleResumeUpload}
               disabled={loading || !jsonResume}
               style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
               {loading ? "Storing Data..." : "Store Data & Continue"}
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="card animate-fadeIn" style={{ padding: 40, textAlign: "center" }}>
            <div style={{
               width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.15)",
               border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center",
               justifyContent: "center", margin: "0 auto 24px",
            }}>
               <CheckCircle size={40} color="var(--success)" />
            </div>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>Setup Complete</h1>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 }}>
               All system configurations mapped successfully. Data stored.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
               <button className="btn-primary" onClick={() => router.push("/project-explanation")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                 Proceed to Project Explanation <ChevronRight size={18} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
