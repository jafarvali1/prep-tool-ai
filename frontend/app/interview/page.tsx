"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Webcam from "react-webcam";
import { 
  Send, Brain, Video, CameraOff, Camera, Play, Settings, Download, Loader2
} from "lucide-react";
import { sendQuickChat, getStageQuestions } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: 1, name: "AI Intro Test" },
  { id: 2, name: "Topic Mocks" },
  { id: 3, name: "Hiring Manager" },
  { id: 4, name: "Technical Panel" },
  { id: 5, name: "System Design" },
  { id: 6, name: "Coding" },
];

export default function RealisticInterviewPage() {
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
    setCandidateName(localStorage.getItem("candidate_name") || "Candidate");
  }, [router]);

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const data = await getStageQuestions(sessionId);
      if (data && data.questions && data.questions.length > 0) {
        setDynamicStageQuestions(data.questions);
        setCurrentStage(1);
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

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { sender: "bot", content: text }]);
    // Speak using TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => setAiSpeaking(false);
      utterance.onerror = () => setAiSpeaking(false);
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("US") || v.name.includes("English")) || voices[0];
      if (preferred) utterance.voice = preferred;
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
      addBotMessage(dynamicStageQuestions[next - 1]);
    } else {
      setCurrentStage(7);
      toast.success("Interview Completed!");
    }
  };

  const handleSend = async () => {
    if (!answer.trim()) return;
    setMessages(prev => [...prev, { sender: "user", content: answer }]);
    
    // Find the last question asked by bot to send as context
    const reversedMsgs = [...messages].reverse();
    const lastBotMsg = reversedMsgs.find(m => m.sender === "bot")?.content || dynamicStageQuestions[currentStage - 1];
    
    const currentAnswer = answer;
    setAnswer("");
    setLoading(true);

    try {
      const prevContext = messages.map(m => `${m.sender}: ${m.content}`).join("\n");
      const data = await sendQuickChat(sessionId, lastBotMsg, currentAnswer, STAGES[currentStage-1].name, prevContext);
      
      // Push AI reply and Evaluation Metadata
      setMessages(prev => [...prev, { 
          sender: "bot", 
          content: data.reply,
          evaluation: data.evaluation // Store strict scores in chat
      }]);
      
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      toast.error("Failed to process answer.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-['Inter']">
      
      {/* TopNavBar Implementation (as requested) */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 sticky top-0 z-50 transition-colors">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-3 text-2xl font-bold tracking-tighter text-on-surface no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <img src="/logo.png" alt="WBL Logo" className="w-6 h-6 object-contain" />
            </div>
            <span>WBL <span className="text-primary-container">PrepHub</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-tight">
            <Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Prep Dashboard
            </Link>
            <Link href="/case-study" className="text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Case Studies
            </Link>
            <Link href="/report" className="text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              My Progress
            </Link>
          <Link href="/setup" className="text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/setup"><Settings className="text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" size={24} /></Link>
            <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary-container">
              <div className="w-full h-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-white font-bold shadow-inner">
                {candidateName ? candidateName.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col p-6 lg:p-10 max-w-screen-2xl mx-auto w-full gap-8">
        
        {/* Interview Progress Indicator */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-surface-container-low/50 backdrop-blur-md p-4 rounded-2xl border border-outline-variant shadow-lg overflow-x-auto">
          <div className="flex items-center justify-between min-w-[800px] px-4">
            {STAGES.map((s, idx) => {
              const isActive = currentStage === s.id;
              const isPast = currentStage > s.id;
              return (
                <div key={s.id} className="flex items-center flex-grow">
                  <div className={`flex flex-col items-center gap-2 ${isActive ? 'group' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${isActive ? 'bg-primary-container text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] ring-2 ring-primary-container ring-offset-2 ring-offset-surface' : isPast ? 'bg-secondary-container text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {s.id}
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-primary-container font-bold' : isPast ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                      {s.name}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`flex-grow h-[2px] mx-4 mb-6 transition-colors duration-500 ${isPast ? 'bg-gradient-to-r from-secondary-container to-primary-container' : 'bg-outline-variant/30'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Dynamic Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          <AnimatePresence mode="wait">
          {currentStage === 7 ? (
             <motion.div key="stage7" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="lg:col-span-12 bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-10 border border-outline-variant/50 shadow-2xl min-h-[50vh] mb-20">
               <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-6">
                   <div>
                     <h2 className="text-4xl font-bold font-['Outfit'] text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Interview Transcript</h2>
                     <p className="text-on-surface-variant mt-2 text-sm">Full log of your AI-generated technical interview tailored to your resume.</p>
                   </div>
                   <button onClick={() => window.print()} className="flex items-center gap-2 bg-gradient-to-r from-secondary-container to-primary-container text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1">
                       <Download size={18} /> Download PDF
                   </button>
               </div>
               <div className="space-y-8" id="printable-transcript">
                   {transcript.map((t, idx) => (
                       <div key={idx} className="bg-surface-container-highest p-6 rounded-2xl border border-outline-variant/30 shadow-md">
                           <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2 bg-primary-container/20 inline-block px-4 py-1.5 rounded-full border border-primary-container/30">Round {idx+1}: {t.stage}</h3>
                           <div className="space-y-4 mt-4">
                               {t.chat.map((m: any, mIdx: number) => (
                                   <div key={mIdx} className={`p-4 rounded-2xl flex flex-col shadow-sm ${m.sender === 'bot' ? 'bg-surface border border-outline-variant/20' : 'bg-primary-container/10 border border-primary-container/30 items-end ml-12'}`}>
                                       <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${m.sender === 'bot' ? 'text-secondary-container' : 'text-primary-container'}`}>{m.sender === 'bot' ? 'PrepAI Agent' : candidateName + ' (You)'}</span>
                                       <p className="text-[15px] font-medium text-on-surface leading-relaxed">{m.content}</p>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           </motion.div>
          ) : currentStage === 0 ? (
            <motion.div key="stage0" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-20}} className="lg:col-span-12 flex flex-col items-center justify-center text-center bg-surface-container-lowest/30 backdrop-blur-md rounded-3xl p-16 border border-outline-variant/30 shadow-2xl min-h-[50vh] relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
              <Video size={64} className="text-primary-container mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
              <h2 className="text-5xl font-bold mb-4 font-['Outfit'] text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Ready to begin your session?</h2>
              <p className="text-on-surface-variant mb-12 max-w-xl text-lg leading-relaxed mix-blend-plus-lighter">
                Experience the "Agentic Aceternity" environment. This hyper-realistic simulation adapts to your explicit resume context and crafts a flawless 6-stage technical loop instantaneously.
              </p>
              <button disabled={isGenerating} onClick={handleStart} className="relative group flex gap-3 items-center justify-center bg-surface-container-high border border-outline-variant text-on-surface px-10 py-5 rounded-2xl text-lg font-bold hover:border-primary-container hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:transform-none">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-container/20 to-secondary-container/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {isGenerating ? <><div className="animate-spin w-5 h-5 border-2 border-on-surface rounded-full border-t-transparent"></div> System Syncing...</> : <><Play size={18} /> Enter Simulator</>}
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div key="stageActive" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
              {/* Left side: Dual Video Interface */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Status bar */}
                <div className="flex justify-between items-center px-4 py-3 bg-surface-container-high/50 backdrop-blur-md rounded-xl border border-outline-variant/30 shadow-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-surface border border-primary-container/30 text-sm font-bold tracking-wide">
                    <div className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_theme(colors.primary-container)] animate-pulse" /> Live Stream Target
                  </div>
                  
                  {/* Timer UI */}
                  <div className={`text-base font-bold tracking-wider px-4 py-1 rounded-lg border ${timeLeft <= 30 ? 'bg-danger/20 text-danger border-danger/50 animate-pulse' : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface'}`}>
                     {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Simulation {currentStage}<span className="opacity-50">/6</span></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-[45vh]">
                  
                  {/* AI Interviewer Video Proxy */}
                  <div className={`relative rounded-3xl overflow-hidden aspect-video border bg-surface-container-lowest flex items-center justify-center transition-all duration-500 shadow-2xl ${aiSpeaking ? 'border-primary-container shadow-[0_0_40px_rgba(139,92,246,0.15)]' : 'border-outline-variant/30 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]'}`}>
                     <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-transform duration-700 bg-surface-container-high border border-outline-variant/50 shadow-2xl ${aiSpeaking ? 'scale-110 shadow-[0_0_60px_rgba(139,92,246,0.5)] border-primary-container animate-[pulse_2s_infinite]' : ''}`}>
                       <Brain size={64} className={`opacity-90 transition-colors duration-300 ${aiSpeaking ? 'text-primary-container' : 'text-on-surface-variant'}`} />
                     </div>
                     {aiSpeaking && (
                       <div className="absolute bottom-[20%] flex gap-2 items-end h-10 filter drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                         {[1,2,3,4,5,6].map(i => (
                           <div key={i} className="w-1.5 bg-primary-container rounded-full" style={{ height: `${20 + Math.random() * 80}%`, animation: `pulse ${0.2 + Math.random()*0.3}s infinite alternate` }} />
                         ))}
                       </div>
                     )}
                     <div className="absolute bottom-5 left-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 px-4 py-2 rounded-xl flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_theme(colors.primary-container)]"></span>
                       <span className="text-xs font-bold text-on-surface tracking-wider">PrepAI Agent</span>
                     </div>
                  </div>

                  {/* User Webcam Stream */}
                  <div className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl border border-outline-variant/30 bg-black flex items-center justify-center">
                    {webcamEnabled ? (
                      <Webcam 
                        audio={false}
                        className="w-full h-full object-cover opacity-90"
                        mirrored
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-outline-variant/50">
                         <CameraOff size={48} className="mb-4 opacity-50" />
                         <span className="text-sm font-medium tracking-widest uppercase">Stream Offline</span>
                      </div>
                    )}
                    <div className="absolute bottom-5 left-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 px-4 py-2 rounded-xl flex items-center gap-3">
                       <span className="text-xs font-bold text-on-surface tracking-wider">{candidateName} (You)</span>
                    </div>
                    <button onClick={() => setWebcamEnabled(!webcamEnabled)} className="absolute top-5 right-5 bg-surface/60 backdrop-blur-xl border border-outline-variant/30 p-3 rounded-full text-on-surface hover:bg-surface-container-high transition">
                      {webcamEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
                    </button>
                  </div>

                </div>
              </div>

              {/* Right side: Interation Panel */}
              <div className="lg:col-span-4 flex flex-col bg-surface-container-high/40 backdrop-blur-xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden h-full min-h-[500px]">
                
                {/* Chat History Header */}
                <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest/50 z-10 backdrop-blur-xl">
                  <h3 className="font-bold text-on-surface tracking-wide">Live Feed Context</h3>
                  <button onClick={nextStage} disabled={loading} className="text-[11px] uppercase tracking-widest font-bold text-primary-container hover:text-white px-3 py-1.5 rounded-lg border border-primary-container/30 hover:bg-primary-container/20 disabled:opacity-50 transition-all">
                    Next Stage
                  </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-transparent">
                  {messages.map((m, i) => (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={i} className={`max-w-[88%] p-4 text-[14.5px] font-medium leading-relaxed shadow-lg flex flex-col gap-2 ${m.sender === 'user' ? 'self-end bg-gradient-to-br from-primary-container to-secondary-container text-white rounded-t-2xl rounded-bl-2xl border border-white/10' : 'self-start bg-surface-container-lowest/80 text-on-surface rounded-t-2xl rounded-br-2xl border border-outline-variant/50 backdrop-blur-md'}`}>
                      <div>{m.content}</div>
                      
                      {/* Strictly Scored Evaluation Render */}
                      {m.evaluation && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/30 text-xs flex flex-col gap-2 bg-black/10 p-3 rounded-xl border border-primary-container/20 shadow-inner">
                           <div className="flex justify-between items-center font-bold text-primary-container uppercase tracking-widest">
                             <span>AI Score</span>
                             <span className="text-lg bg-surface px-2 py-0.5 rounded-lg border border-primary-container/30 shadow-sm">{m.evaluation.overall_score}/10</span>
                           </div>
                           {m.evaluation.gap_analysis && m.evaluation.gap_analysis.length > 0 && (
                             <ul className="list-disc pl-4 text-on-surface-variant space-y-1">
                               {m.evaluation.gap_analysis.map((gap: string, gIdx: number) => <li key={gIdx}>{gap}</li>)}
                             </ul>
                           )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="self-start text-[11px] uppercase tracking-widest font-bold text-on-surface-variant animate-pulse flex items-center gap-3 px-2">
                       <Loader2 className="w-4 h-4 animate-spin text-primary-container" />
                       Engine evaluating...
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-5 bg-surface-container-lowest/50 backdrop-blur-xl border-t border-outline-variant/30">
                  <div className="relative group">
                    <textarea 
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Compile response..."
                      className="w-full bg-surface-container-high border border-outline-variant/50 rounded-2xl py-4 pl-5 pr-14 text-[15px] font-medium text-on-surface focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none resize-none shadow-inner"
                      rows={2}
                      disabled={loading}
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />
                    <button onClick={handleSend} disabled={loading || !answer.trim()} className="absolute right-3 top-3 bottom-3 w-10 h-10 flex items-center justify-center rounded-xl bg-primary-container text-white hover:bg-secondary-container disabled:opacity-50 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all">
                      <Send size={16} />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
          </AnimatePresence>

        </div>
      </main>

    </div>
  );
}
