// frontend\app\interview\page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Webcam from "react-webcam";
import { 
  Send, Video, CameraOff, Camera, Play, Settings, Download, Loader2, ArrowLeft, Lightbulb, Volume2, VolumeX,
  Sparkles, MessageSquare, Mic, MicOff, UserRound, Headphones, PenSquare, Code2, HelpCircle
} from "lucide-react";
import { sendQuickChat, getStageQuestions, saveProjectBrief, getResumeSummary, getResumeAnalytics } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: 1, name: "AI Intro Test" },
  { id: 2, name: "Mock Section" },
  { id: 3, name: "Hiring Manager" },
  { id: 4, name: "Technical Panel" },
  { id: 5, name: "System Design" },
  { id: 6, name: "Coding" },
];

export default function RealisticInterviewPage() {
  const normalizeName = (name: string) => {
    const bad = ["candidate", "professional experience", "experience", "resume"];
    const n = (name || "").trim();
    if (!n || bad.includes(n.toLowerCase())) return "Candidate";
    return n;
  };
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [candidateName, setCandidateName] = useState("");

  const [currentStage, setCurrentStage] = useState(0); 
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  
  // Dummy AI Video states
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Chat States
  const [messages, setMessages] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicStageQuestions, setDynamicStageQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<number, number>>({
    1: 1,   // intro always 1
    2: 10,  // mock section
    3: 5,   // hiring manager
    4: 10,  // technical panel
    5: 1,   // system design
    6: 1,   // coding
  });
  const [answeredInStage, setAnsweredInStage] = useState(0);
  const [readyForNextStage, setReadyForNextStage] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [briefPromptText, setBriefPromptText] = useState("");
  const [briefInput, setBriefInput] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    let timer: any;
    if (currentStage > 0 && currentStage <= 6 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && !loading) {
        toast("Time's up for this question!");
    }
    return () => clearInterval(timer);
  }, [currentStage, timeLeft, loading]);

  useEffect(() => {
    setMounted(true);
    const sid = localStorage.getItem("session_id");
    if (!sid) { router.push("/setup"); return; }
    setSessionId(sid);
    const localName = normalizeName(localStorage.getItem("candidate_name") || "");
    if (localName) setCandidateName(localName);
    getResumeSummary(sid)
      .then((data) => {
        const cleaned = normalizeName(data?.candidate_name || "");
        if (cleaned && cleaned !== "Candidate") {
          localStorage.setItem("candidate_name", cleaned);
          setCandidateName(cleaned);
        } else {
          getResumeAnalytics(sid)
            .then((a) => {
              const intro = (a?.sample_intro || "") as string;
              const m = intro.match(/my name is\s+([A-Za-z ]+)\./i);
              const inferred = normalizeName((m?.[1] || "").trim());
              if (inferred !== "Candidate") {
                localStorage.setItem("candidate_name", inferred);
                setCandidateName(inferred);
              } else {
                setCandidateName(localName || "Candidate");
              }
            })
            .catch(() => setCandidateName(localName || "Candidate"));
        }
      })
      .catch(() => setCandidateName(localName || "Candidate"));
  }, [router]);

  useEffect(() => {
    return () => {
      try {
        speechRecognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      const english = voices.filter((v) => /en|english/i.test(v.lang) || /english/i.test(v.name));
      const finalVoices = english.length ? english : voices;
      setAvailableVoices(finalVoices);
      if (!selectedVoiceName && finalVoices.length > 0) {
        const preferred =
          finalVoices.find((v) => /female|samantha|zira|aria|google/i.test(v.name)) ||
          finalVoices[0];
        setSelectedVoiceName(preferred.name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceName]);

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const data = await getStageQuestions(sessionId);
      if (data?.needs_project_brief) {
        setBriefPromptText(
          data.briefing_prompt ||
            "Please share your first project details: problem, stack, your role, and impact."
        );
        setShowBriefModal(true);
        return;
      }
      if (data && data.questions && data.questions.length > 0) {
        setDynamicStageQuestions(data.questions);
        setCurrentStage(1);
        setAnsweredInStage(0);
        setReadyForNextStage(false);
        addBotMessage(data.questions[0]);
      } else {
        throw new Error("Empty questions returned");
      }
    } catch (e) {
      toast.error("Failed to generate contextual questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitBriefAndStart = async () => {
    if (!briefInput || briefInput.trim().length < 40) {
      toast.error("Please provide a bit more detail.");
      return;
    }
    try {
      setLoading(true);
      await saveProjectBrief(sessionId, briefInput.trim());
      setShowBriefModal(false);
      setBriefInput("");
      const refreshed = await getStageQuestions(sessionId);
      if (!refreshed?.questions || refreshed.questions.length === 0) {
        throw new Error("Could not generate questions after project brief.");
      }
      setDynamicStageQuestions(refreshed.questions);
      setCurrentStage(1);
      setAnsweredInStage(0);
      setReadyForNextStage(false);
      addBotMessage(refreshed.questions[0]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start interview from project brief.");
    } finally {
      setLoading(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { sender: "bot", content: text }]);
    // Speak using TTS
    if (voiceEnabled && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => setAiSpeaking(false);
      utterance.onerror = () => setAiSpeaking(false);
      const voice = availableVoices.find((v) => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const nextStage = () => {
    setTranscript(prev => [...prev, { stage: STAGES[currentStage-1].name, chat: [...messages] }]);
    const next = currentStage + 1;
    if (next <= 6) {
      setCurrentStage(next);
      setMessages([]);
      setTimeLeft(120);
      setAnsweredInStage(0);
      setReadyForNextStage(false);
      addBotMessage(dynamicStageQuestions[next - 1]);
    } else {
      setCurrentStage(7);
      toast.success("Interview Completed!");
    }
  };

  const toggleCandidateVoice = () => {
    if (isRecordingAnswer) {
      speechRecognitionRef.current?.stop?.();
      setIsRecordingAnswer(false);
      return;
    }
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice input needs Chrome or Edge.");
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        chunk += event.results[i][0].transcript;
      }
      if (event.results[event.results.length - 1].isFinal) {
        setAnswer((prev) => {
          const t = prev.trim();
          const sp = t.length > 0 && !t.endsWith(" ") ? " " : "";
          return t + sp + chunk.trim();
        });
      }
    };
    recognition.onerror = () => {
      setIsRecordingAnswer(false);
      toast.error("Microphone error — check permissions.");
    };
    recognition.onend = () => setIsRecordingAnswer(false);
    recognition.start();
    speechRecognitionRef.current = recognition;
    setIsRecordingAnswer(true);
    toast("Listening… tap mic again to stop.", { icon: "🎙️", duration: 3000 });
  };

  const handleSend = async () => {
    if (isRecordingAnswer && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsRecordingAnswer(false);
    }
    if (!answer.trim()) return;
    setMessages(prev => [...prev, { sender: "user", content: answer }]);
    
    // Find the last question asked by bot to send as context
    const reversedMsgs = [...messages].reverse();
    const lastBotMsg = reversedMsgs.find(m => m.sender === "bot")?.content || dynamicStageQuestions[currentStage - 1];
    
    const currentAnswer = answer;
    const lowerAnswer = currentAnswer.toLowerCase();
    const unsure = ["not sure", "don't know", "do not know", "no idea", "unable to answer", "can't answer", "cannot answer"]
      .some((k) => lowerAnswer.includes(k));
    setAnswer("");
    setLoading(true);

    try {
      const prevContext = messages.map(m => `${m.sender}: ${m.content}`).join("\n");
      const data = await sendQuickChat(sessionId, lastBotMsg, currentAnswer, STAGES[currentStage-1].name, prevContext);
      
      // Push AI reply and Evaluation Metadata
      let replyText = data.reply;
      if (unsure && data?.evaluation?.improved_answer) {
        replyText = `I understand you were unsure about this one. An expected answer could be:\n\n${data.evaluation.improved_answer}\n\n${data.reply}`;
      }

      const target = stageCounts[currentStage] || 1;
      const newCount = answeredInStage + 1;
      let finalReply = replyText;

      if (currentStage === 1) {
        finalReply = `${replyText}\n\nGreat. Intro evaluation is complete. Please click "Next Stage" to continue.`;
        setReadyForNextStage(true);
      } else if (newCount >= target) {
        finalReply = `${replyText}\n\nSection complete (${newCount}/${target}). Click "Next Stage" when ready.`;
        setReadyForNextStage(true);
      } else {
        finalReply = `${replyText}\n\nQuestion ${newCount + 1}/${target}: ${data.reply}`;
        setReadyForNextStage(false);
      }

      setMessages(prev => [...prev, {
          sender: "bot", 
          content: finalReply,
          evaluation: data.evaluation // Store strict scores in chat
      }]);
      setAnsweredInStage(newCount);
      
      if (voiceEnabled && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(replyText);
        const voice = availableVoices.find((v) => v.name === selectedVoiceName);
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Failed to process answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleNeedHelp = async () => {
    if (loading || currentStage < 1 || currentStage > 6) return;
    setAnswer("I am not sure about this answer. Please suggest a good answer.");
    setTimeout(() => handleSend(), 0);
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col font-['Inter'] text-on-surface overflow-x-hidden bg-surface">
      <div className="pointer-events-none fixed inset-0 bg-primary-container/[0.07]" aria-hidden />
      <div className="pointer-events-none fixed top-20 -left-24 h-72 w-72 rounded-full bg-primary-container/15 blur-[88px]" aria-hidden />
      <div className="pointer-events-none fixed bottom-10 right-0 h-64 w-64 rounded-full bg-secondary-container/15 blur-[80px]" aria-hidden />

      <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl">
        <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-3 w-full px-4 sm:px-6 lg:px-8 py-3.5 md:py-4 max-w-screen-2xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0 text-xl md:text-2xl font-bold tracking-tight text-on-surface no-underline">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center shadow-lg ring-1 ring-primary-container/30">
              <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <span>WBL <span className="text-primary-container">PrepHub</span></span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary-container/50 bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <Link href="/setup" className="p-2 rounded-lg border border-outline-variant/40 bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface hover:border-primary-container/50 transition-colors">
              <Settings size={22} />
            </Link>
            <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container-high">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
                {candidateName ? candidateName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">You</span>
                <span className="text-sm font-medium text-on-surface">{candidateName || "Candidate"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 max-w-screen-2xl mx-auto w-full gap-6 lg:gap-8">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-2xl bg-surface-container-low/60 backdrop-blur-md px-3 py-4 sm:px-5 md:px-6 md:py-5 border border-outline-variant/50 shadow-lg overflow-x-auto overscroll-contain">
          <div className="flex items-end justify-between gap-0 min-w-max pb-1">
            {STAGES.map((s, idx) => {
              const isActive = currentStage === s.id;
              const isPast = currentStage > s.id;
              return (
                <div key={s.id} className="flex items-end flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-2 w-[4.25rem] sm:w-20 md:min-w-[5.5rem] shrink-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 shrink-0 ${isActive ? "bg-primary-container text-on-primary-container shadow-lg scale-105 ring-2 ring-primary-container ring-offset-2 ring-offset-surface" : isPast ? "bg-secondary-container text-on-secondary" : "bg-surface-container-highest text-on-surface-variant"}`}>
                      {s.id}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-medium text-center leading-snug px-0.5 line-clamp-2 min-h-[2.25rem] ${isActive ? "text-primary-container font-bold" : isPast ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                      {s.name}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`flex-1 h-px mx-1.5 sm:mx-3 mb-[1.35rem] min-w-[0.75rem] max-w-full self-end ${isPast ? "bg-gradient-to-r from-secondary-container to-primary-container" : "bg-outline-variant/30"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 rounded-2xl bg-surface-container-high/40 backdrop-blur-md p-5 md:p-6 border border-outline-variant/50 shadow-lg flex flex-col justify-center min-h-0">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container/20 border border-primary-container/30">
                <Headphones size={20} className="text-primary-container" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold text-on-surface font-['Outfit'] text-base">Interviewer voice</p>
                <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">How the AI sounds when reading questions aloud.</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl bg-surface-container-high/40 backdrop-blur-md p-5 md:p-6 border border-outline-variant/50 shadow-lg flex flex-col justify-center min-h-0">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button type="button" onClick={() => setVoiceEnabled((v) => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-high px-3.5 py-2.5 text-xs font-semibold hover:border-primary-container/50 transition-colors shrink-0">
                {voiceEnabled ? <Volume2 size={16} className="text-primary-container" /> : <VolumeX size={16} />}
                {voiceEnabled ? "TTS on" : "TTS off"}
              </button>
              <select value={selectedVoiceName} onChange={(e) => setSelectedVoiceName(e.target.value)} className="input-field flex-1 min-w-[140px] sm:min-w-[180px] rounded-xl text-xs py-2.5 px-3">
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
              <button type="button" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-high px-3.5 py-2.5 text-xs font-semibold text-on-surface hover:border-primary-container/50 transition-colors shrink-0" onClick={() => {
                if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
                const u = new SpeechSynthesisUtterance("Hello, this is your selected interview voice.");
                const v = availableVoices.find((x) => x.name === selectedVoiceName);
                if (v) u.voice = v;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
              }}>
                <Sparkles size={14} /> Test
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 flex-1 min-h-0">
          <AnimatePresence mode="wait">
          {currentStage === 7 ? (
             <motion.div key="stage7" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="lg:col-span-12 rounded-3xl bg-surface-container-low/40 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 border border-outline-variant/50 shadow-2xl min-h-[50vh] mb-10 lg:mb-16 w-full">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-outline-variant/20">
                   <div className="min-w-0 space-y-2">
                     <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Outfit'] text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Interview transcript</h2>
                     <p className="text-on-surface-variant text-sm md:text-base max-w-2xl leading-relaxed">Everything you practiced in this session, ready to save or print.</p>
                   </div>
                   <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary-container to-primary-container text-on-primary px-5 sm:px-6 py-3 text-sm font-bold shadow-lg ring-1 ring-primary-container/40 hover:ring-primary-container/60 transition-all hover:-translate-y-0.5 shrink-0 w-full sm:w-auto">
                       <Download size={18} /> Save as PDF
                   </button>
               </div>
               <div className="space-y-6 lg:space-y-8" id="printable-transcript">
                   {transcript.map((t, idx) => (
                       <div key={idx} className="rounded-2xl bg-surface-container-highest p-5 sm:p-6 lg:p-8 border border-outline-variant/40 shadow-md w-full">
                           <h3 className="text-base md:text-lg font-bold font-['Outfit'] text-on-surface mb-5 sm:mb-6 inline-flex items-center gap-2 bg-primary-container/20 px-4 py-2 rounded-full border border-primary-container/30">Round {idx+1}: {t.stage}</h3>
                           <div className="space-y-3 sm:space-y-4 mt-1">
                               {t.chat.map((m: any, mIdx: number) => (
                                   <div key={mIdx} className={`rounded-2xl px-4 py-4 sm:px-5 sm:py-4 shadow-sm ${m.sender === 'bot' ? 'bg-surface border border-outline-variant/20 text-left' : 'bg-primary-container/10 border border-primary-container/30 text-right ml-6 sm:ml-12 md:ml-20 max-w-full'}`}>
                                       <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${m.sender === 'bot' ? 'text-secondary-container' : 'text-primary-container'}`}>{m.sender === 'bot' ? 'Interviewer' : `${candidateName || 'You'}`}</span>
                                       <p className="text-[15px] text-on-surface leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           </motion.div>
          ) : currentStage === 0 ? (
            <motion.div key="stage0" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-12}} className="lg:col-span-12 flex flex-col items-center text-center rounded-3xl bg-surface-container-lowest/35 backdrop-blur-md px-6 py-14 md:p-20 border border-outline-variant/30 shadow-2xl min-h-[52vh] relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] bg-primary-container/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-container/20 border border-primary-container/30 mb-8 shadow-lg ring-1 ring-primary-container/25">
                <Video size={40} className="text-primary-container" />
              </div>
              <h2 className="relative text-3xl md:text-5xl font-bold font-['Outfit'] tracking-tight mb-4 text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Start your mock interview</h2>
              <p className="relative text-on-surface-variant mb-14 md:mb-16 max-w-lg text-base md:text-lg leading-relaxed">
                Six stages tailored to your resume — intro through coding. Adjust question counts, then step in when you are ready.
              </p>
              <div className="relative w-full max-w-2xl mb-14 md:mb-16 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 text-left">
                <label className="block text-base sm:text-lg font-medium text-on-surface">Mock section
                  <select className="mt-2 w-full min-h-11 py-2.5 px-3 rounded-xl bg-surface-container-high border border-outline-variant/50 outline-none text-on-surface text-sm" value={stageCounts[2]} onChange={(e) => setStageCounts((p) => ({ ...p, 2: Number(e.target.value) }))}>
                    <option value={10}>10 questions</option>
                    <option value={20}>20 questions</option>
                    <option value={30}>30 questions</option>
                  </select>
                </label>
                <label className="block text-base sm:text-lg font-medium text-on-surface">Hiring manager
                  <select className="mt-2 w-full min-h-11 py-2.5 px-3 rounded-xl bg-surface-container-high border border-outline-variant/50 outline-none text-on-surface text-sm" value={stageCounts[3]} onChange={(e) => setStageCounts((p) => ({ ...p, 3: Number(e.target.value) }))}>
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                  </select>
                </label>
                <label className="block text-base sm:text-lg font-medium text-on-surface">Technical panel
                  <select className="mt-2 w-full min-h-11 py-2.5 px-3 rounded-xl bg-surface-container-high border border-outline-variant/50 outline-none text-on-surface text-sm" value={stageCounts[4]} onChange={(e) => setStageCounts((p) => ({ ...p, 4: Number(e.target.value) }))}>
                    <option value={10}>10 questions</option>
                    <option value={20}>20 questions</option>
                    <option value={30}>30 questions</option>
                  </select>
                </label>
                <label className="block text-base sm:text-lg font-medium text-on-surface">System design / coding
                  <select className="mt-2 w-full min-h-11 py-2.5 px-3 rounded-xl bg-surface-container-high border border-outline-variant/50 outline-none text-on-surface text-sm" value={stageCounts[5]} onChange={(e) => setStageCounts((p) => ({ ...p, 5: Number(e.target.value), 6: Number(e.target.value) }))}>
                    <option value={1}>1 each</option>
                    <option value={2}>2 each</option>
                  </select>
                </label>
              </div>
              <button type="button" disabled={isGenerating} onClick={handleStart} className="relative mt-4 md:mt-6 flex gap-3 items-center justify-center rounded-2xl bg-surface-container-high border border-outline-variant text-on-surface px-10 py-4 md:py-5 text-base md:text-lg font-bold hover:border-primary-container hover:shadow-lg hover:ring-1 hover:ring-primary-container/35 transition-all duration-300 disabled:opacity-45">
                <span className="relative z-10 flex h-8 w-50 justify-center items-center  gap-2">
                  {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing…</> : <><Play size={20} /> Begin session</>}
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div key="stageActive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Chat — primary (7 cols) */}
              <div className="order-1 lg:col-span-7 flex flex-col min-h-0 min-w-0 rounded-3xl bg-surface-container-high/45 backdrop-blur-xl border border-outline-variant/35 shadow-2xl overflow-hidden max-h-[min(620px,calc(100dvh-8rem))] lg:max-h-none lg:min-h-[560px]">
                <div className="px-5 py-5 md:px-7 md:py-6 flex flex-wrap items-start justify-between gap-4 shrink-0 bg-surface-container-lowest/40 border-b border-outline-variant/25">
                  <div className="flex gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container/25 border border-secondary-container/40">
                      <MessageSquare size={22} className="text-primary-container" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg md:text-xl font-['Outfit'] text-on-surface">Conversation</h3>
                      <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">Type or use the mic — speech becomes text in the box.</p>
                    </div>
                  </div>
                  <button type="button" onClick={nextStage} disabled={loading} className={`shrink-0 rounded-xl text-[11px] uppercase tracking-widest font-bold px-4 py-2.5 border transition-all ${readyForNextStage ? "text-on-primary-container border-primary-container bg-primary-container shadow-lg ring-1 ring-primary-container/50" : "text-primary-container border-primary-container/35 bg-surface-container-high/50 hover:bg-primary-container/15"} disabled:opacity-45`}>
                    Next stage
                  </button>
                </div>
                <div className="mx-5 md:mx-7 mb-2 shrink-0 rounded-xl bg-primary-container/8 border border-primary-container/20 px-4 py-3 flex gap-3 items-start">
                  <Lightbulb size={18} className="text-primary-container shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {currentStage === 1 && "Intro only: your name, background, strengths, and goal."}
                    {currentStage === 3 && "Hiring manager: behavioral and project-focused questions."}
                    {currentStage === 4 && "Technical panel: rigorous, interview-standard depth."}
                    {currentStage !== 1 && currentStage !== 3 && currentStage !== 4 && "Answer with a clear structure."}
                  </p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-7 py-4 flex flex-col gap-7">
                  {messages.map((m, i) => (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[min(94%,32rem)] rounded-2xl px-5 py-4 md:py-5 shadow-lg ${m.sender === "user" ? "rounded-br-md bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container border border-on-primary-container/15" : "rounded-bl-md bg-surface-container-lowest/95 text-on-surface border border-outline-variant/50 backdrop-blur-md"}`}>
                        {m.sender === "bot" && (
                          <div className="flex items-center gap-2 mb-3">
                            <img src="/logo.png" alt="" className="w-7 h-7 rounded-full border border-primary-container/50 bg-surface p-1 object-contain" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Interviewer</span>
                          </div>
                        )}
                        {m.sender === "user" && <span className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container/80 block mb-2 text-right">You</span>}
                        <div className={`text-[15px] leading-[1.65] whitespace-pre-wrap ${m.sender === "user" ? "text-on-primary-container" : "text-on-surface"}`}>{m.content}</div>
                        {m.evaluation && (
                          <div className={`mt-4 pt-4 space-y-2 rounded-xl px-3 py-3 border border-outline-variant/25 ${m.sender === "user" ? "bg-surface-container-lowest/45" : "bg-surface-container-lowest/35"}`}>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-primary-container">
                              <span>Score</span>
                              <span className="tabular-nums text-base bg-surface px-2 py-0.5 rounded-lg border border-primary-container/30 text-on-surface">{m.evaluation.overall_score}/10</span>
                            </div>
                            {m.evaluation.gap_analysis?.length > 0 && (
                              <ul className="text-xs space-y-1.5 text-on-surface-variant list-disc pl-4">
                                {m.evaluation.gap_analysis.map((gap: string, gIdx: number) => (
                                  <li key={gIdx}>{gap}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-container" />
                        Evaluating…
                      </div>
                    </div>
                  )}
                </div>
                <div className="shrink-0 px-5 py-5 md:px-7 md:py-6 bg-surface-container-lowest/50 border-t border-outline-variant/25 space-y-4">
                  {(currentStage === 5 || currentStage === 6) && (
                    <div className="flex flex-wrap gap-2">
                      {currentStage === 5 && (
                        <a href="https://excalidraw.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl border border-outline-variant/45 bg-surface-container-high/70 hover:border-primary-container/50 transition-colors">
                          <PenSquare size={14} className="text-primary-container" /> Excalidraw
                        </a>
                      )}
                      {currentStage === 6 && (
                        <a href="https://www.onlinegdb.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl border border-outline-variant/45 bg-surface-container-high/70 hover:border-primary-container/50 transition-colors">
                          <Code2 size={14} className="text-primary-container" /> Code playground
                        </a>
                      )}
                    </div>
                  )}
                  <div className="rounded-2xl bg-surface-container-high/50 border border-outline-variant/40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <span className="text-xs font-medium text-on-surface-variant">Your answer</span>
                      <span className={`text-[11px] font-medium rounded-full px-2.5 py-1 ${isRecordingAnswer ? "bg-error/15 text-error" : "bg-primary-container/15 text-primary-container"}`}>
                        {isRecordingAnswer ? "Listening…" : "Speech to text"}
                      </span>
                    </div>
                    <div className="flex items-end gap-2 px-3 pb-3">
                      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your response… (mic on the right)" className="flex-1 min-w-0 rounded-2xl bg-surface-container-high border border-outline-variant/50 px-4 py-3 text-[15px] leading-relaxed text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent resize-none min-h-[96px] max-h-[200px] shadow-inner" rows={3} disabled={loading} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                      <motion.button type="button" whileTap={{ scale: 0.94 }} aria-label="Dictate" onClick={toggleCandidateVoice} disabled={loading || currentStage < 1 || currentStage > 6} className={`mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${isRecordingAnswer ? "border-error/60 bg-error/15 text-error" : "border-primary-container/50 bg-primary-container/15 text-primary-container hover:bg-primary-container/25"} disabled:opacity-35`}>
                        {isRecordingAnswer ? <MicOff size={22} /> : <Mic size={22} />}
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest/40 border-t border-outline-variant/25">
                      <button type="button" onClick={handleNeedHelp} disabled={loading} className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-45">
                        <HelpCircle size={14} className="text-secondary-container" />
                        Suggested answer
                      </button>
                      <button type="button" onClick={handleSend} disabled={loading || !answer.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary-container text-on-primary-container px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all shadow-lg ring-1 ring-primary-container/40">
                        <Send size={16} /> Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video sidebar — secondary (5 cols) */}
              <div className="order-2 lg:col-span-5 flex flex-col gap-4 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6 rounded-xl bg-surface-container-high/50 backdrop-blur-md border border-outline-variant/35 shadow-lg">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 border border-primary-container/25 text-xs font-bold text-on-surface">
                    <span className="h-2 w-2 rounded-full bg-primary-container ring-2 ring-primary-container/50 shadow-lg animate-pulse" /> Live
                  </span>
                  <span className={`tabular-nums text-sm font-bold px-4 py-1 rounded-lg border ${timeLeft <= 30 ? "bg-error/15 text-error border-error/40 animate-pulse" : "bg-surface-container-lowest border-outline-variant/50 text-on-surface"}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Round {currentStage}<span className="opacity-50">/6</span></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className={`relative aspect-video rounded-3xl overflow-hidden flex items-center justify-center border bg-surface-container-lowest transition-all duration-500 shadow-2xl ${aiSpeaking ? "border-primary-container ring-2 ring-primary-container/30 shadow-lg" : "border-outline-variant/30"}`}>
                    <div className={`flex h-32 w-32 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant/50 shadow-2xl transition-transform duration-700 ${aiSpeaking ? "scale-110 border-primary-container ring-2 ring-primary-container/40 shadow-lg" : ""}`}>
                      <div className="relative">
                        <UserRound size={48} className={aiSpeaking ? "text-primary-container" : "text-on-surface-variant"} />
                        <Sparkles size={16} className="absolute -right-1 -top-1 text-primary-container animate-pulse" />
                      </div>
                    </div>
                    {aiSpeaking && (
                      <div className="absolute bottom-[18%] flex h-8 items-end gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-1.5 rounded-full bg-primary-container" style={{ height: `${24 + (i * 7) % 40}%`, animation: `pulse ${0.25 + i * 0.05}s ease-in-out infinite alternate` }} />
                        ))}
                      </div>
                    )}
                    <div className="absolute bottom-5 left-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 px-4 py-2 rounded-xl">
                      <span className="text-xs font-bold text-on-surface tracking-wider">PrepAI</span>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest shadow-2xl">
                    {webcamEnabled ? (
                      <Webcam audio={false} className="h-full w-full object-cover opacity-90" mirrored />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-outline-variant/50">
                        <CameraOff size={48} className="mb-4 opacity-50" />
                        <span className="text-sm font-medium tracking-widest uppercase">Stream offline</span>
                      </div>
                    )}
                    <div className="absolute bottom-5 left-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 px-4 py-2 rounded-xl">
                      <span className="text-xs font-bold text-on-surface tracking-wider">{candidateName} (You)</span>
                    </div>
                    <button type="button" onClick={() => setWebcamEnabled(!webcamEnabled)} className="absolute top-5 right-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 p-3 rounded-full text-on-surface hover:bg-surface-container-high transition">
                      {webcamEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

        </div>
      </main>

      {showBriefModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-xl card p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-semibold font-['Outfit'] text-on-surface">Project context needed</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{briefPromptText}</p>
            <textarea
              className="w-full min-h-[140px] bg-surface-container-high border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent"
              rows={6}
              value={briefInput}
              onChange={(e) => setBriefInput(e.target.value)}
              placeholder="Describe company, project problem, users, stack, your role, and impact..."
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={() => setShowBriefModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitBriefAndStart}>Proceed</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
