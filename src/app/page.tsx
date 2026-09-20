"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Lightbulb,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Zap,
  RotateCcw,
  Image as ImageIcon,
  ArrowLeft,
  BookMarked,
  Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/* ─── Types ─── */
interface Exercise {
  name: string;
  questions: string[];
}

type AppView = "upload" | "loading" | "dashboard" | "result";

/* ─── Component ─── */
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [solverLoading, setSolverLoading] = useState(false);
  const [solutionResult, setSolutionResult] = useState<string | null>(null);
  const [solutionType, setSolutionType] = useState<"hint" | "solution" | null>(null);
  const [view, setView] = useState<AppView>("upload");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((selected: File) => {
    setFile(selected);
    setFileType(selected.type);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFileBase64(base64);
      parseStructure(base64, selected.type);
    };
    reader.readAsDataURL(selected);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const selected = e.dataTransfer.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile]
  );

  const parseStructure = async (base64: string, mimeType: string) => {
    setView("loading");
    setExercises([]);
    setSelectedExercise(null);
    setSelectedQuestion(null);
    setSolutionResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/parse-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64, mimeType }),
      });
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textError = await res.text();
        if (textError.includes("Request Entity Too Large") || res.status === 413) {
           throw new Error("File is too large! Vercel limits uploads to ~3.5 MB. Please upload a smaller PDF or a screenshot.");
        }
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse");
      }

      if (data.exercises && data.exercises.length > 0) {
        setExercises(data.exercises);
        setView("dashboard");
      } else {
        setErrorMsg(data.error || "Could not detect exercises. Try a clearer image or PDF.");
        setView("upload");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Something went wrong on the server.");
    } finally {setView("upload");
    }
  };

  const fetchSolution = async (type: "hint" | "solution") => {
    if (!fileBase64 || !selectedExercise || !selectedQuestion) return;
    setSolverLoading(true);
    setSolutionResult(null);
    setSolutionType(type);
    setView("result");

    try {
      const res = await fetch("/api/solve-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          mimeType: fileType,
          exercise: selectedExercise.name,
          question: selectedQuestion,
          type,
        }),
      });
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textError = await res.text();
        if (textError.includes("Request Entity Too Large") || res.status === 413) {
           throw new Error("File is too large! Vercel limits uploads to ~3.5 MB. Please upload a smaller PDF or a screenshot.");
        }
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to solve");
      }

      setSolutionResult(data.result || "⚠️ Could not generate a response. Please try again.");
    } catch (error: any) {
      setSolutionResult(`⚠️ ${error.message || "Network error. Check your connection and try again."}`);
    } finally {
      setSolverLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setFileBase64("");
    setFileType("");
    setExercises([]);
    setSelectedExercise(null);
    setSelectedQuestion(null);
    setSolutionResult(null);
    setSolutionType(null);
    setView("upload");
    setErrorMsg(null);
  };

  const goBackToDashboard = () => {
    setSolutionResult(null);
    setSolutionType(null);
    setView("dashboard");
  };

  const totalQ = exercises.reduce((s, e) => s + e.questions.length, 0);

  return (
    <>
      {/* Animated background */}
      <div className="bg-scene" />
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none" />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* ═══ HEADER ═══ */}
        <header className="glass sticky top-0 z-50 border-b border-indigo-500/5">
          <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-pulse-glow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                  JEE AI Prep
                </h1>
                <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">Smart Study Assistant</p>
              </div>
            </div>

            {view !== "upload" && (
              <button onClick={resetAll} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
                <RotateCcw className="w-3 h-3" />
                New Upload
              </button>
            )}
          </div>
        </header>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-5xl">

            {/* ═══════════════════════════════ */}
            {/*         UPLOAD VIEW             */}
            {/* ═══════════════════════════════ */}
            {view === "upload" && (
              <div className="flex flex-col items-center gap-10">
                {/* Hero */}
                <div className="text-center space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-hover text-[11px] text-indigo-300 tracking-wide uppercase">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Powered by Gemini AI
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                    <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                      Upload Your
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                      JEE Module
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                    Drop a PDF or photo. AI reads every question, breaks it into exercises, and gives you formulas, hints, or full solutions — instantly.
                  </p>
                </div>

                {/* Upload Box */}
                <div className="gradient-border w-full max-w-lg">
                  <div
                    className={`glass p-1 rounded-[1.2rem] ${dragOver ? "ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-[#050510]" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <div
                      className={`rounded-xl border-2 border-dashed border-indigo-500/20 p-14 sm:p-20 cursor-pointer hover:border-indigo-400/40 transition-colors flex flex-col items-center gap-6 ${dragOver ? "drag-active" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Upload className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="font-semibold text-slate-200 text-lg">Click or drag & drop</p>
                        <p className="text-xs text-slate-500">Supports PDF, JPG, PNG</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="glass rounded-xl px-5 py-3 text-sm text-red-300 border border-red-500/15 max-w-md w-full text-center">
                    ⚠️ {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════ */}
            {/*        LOADING VIEW             */}
            {/* ═══════════════════════════════ */}
            {view === "loading" && (
              <div className="flex flex-col items-center gap-8 py-20">
                <div className="relative flex items-center justify-center">
                  <div className="spinner-ring" />
                  <Brain className="w-5 h-5 text-indigo-400 absolute" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-indigo-300">
                    Reading your document...
                  </p>
                  <p className="text-sm text-slate-500 max-w-xs">
                    AI is scanning every page, identifying exercises and question numbers
                  </p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════ */}
            {/*       DASHBOARD VIEW            */}
            {/* ═══════════════════════════════ */}
            {view === "dashboard" && (
              <div className="space-y-5">
                {/* Top Info Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="glass-hover rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 truncate max-w-[160px]">{file?.name}</span>
                  </div>
                  <div className="glass-hover rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs">
                    <BookMarked className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-300">
                      <strong className="text-white">{exercises.length}</strong> Exercises
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">
                      <strong className="text-white">{totalQ}</strong> Questions
                    </span>
                  </div>
                </div>

                {/* Main Card */}
                <div className="gradient-border">
                  <div className="glass rounded-[1.2rem] p-5 sm:p-7 space-y-7">

                    {/* Step 1: Exercises */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">1</div>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Select Exercise</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercises.map((ex, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedExercise(ex);
                              setSelectedQuestion(null);
                              setSolutionResult(null);
                            }}
                            className={`ex-tab ${selectedExercise?.name === ex.name ? "ex-tab-active" : ""}`}
                          >
                            {ex.name}
                            <span className={`ml-1.5 text-[10px] ${selectedExercise?.name === ex.name ? "text-indigo-200" : "text-slate-500"}`}>
                              {ex.questions.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Questions */}
                    {selectedExercise && (
                      <div className="space-y-3 pt-5 border-t border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">2</div>
                          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                            Question — <span className="text-indigo-300">{selectedExercise.name}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                          {selectedExercise.questions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedQuestion(q);
                                setSolutionResult(null);
                              }}
                              className={`q-btn aspect-square flex items-center justify-center text-sm ${selectedQuestion === q ? "q-btn-active" : ""}`}
                            >
                              <span className="relative z-10">{q}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Actions */}
                    {selectedQuestion && (
                      <div className="pt-5 border-t border-white/[0.03] space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">3</div>
                          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                            Help for <span className="text-white font-bold">Q{selectedQuestion}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Hint */}
                          <button
                            onClick={() => fetchSolution("hint")}
                            disabled={solverLoading}
                            className="action-card action-hint group flex items-center gap-4 disabled:opacity-40"
                          >
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                              <Lightbulb className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold text-sm text-amber-200/90">Formula & Hint</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Key formulas & approach</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                          </button>

                          {/* Solution */}
                          <button
                            onClick={() => fetchSolution("solution")}
                            disabled={solverLoading}
                            className="action-card action-solution group flex items-center gap-4 disabled:opacity-40"
                          >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Zap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold text-sm text-emerald-200/90">Full Solution</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step breakdown</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════ */}
            {/*        RESULT VIEW              */}
            {/* ═══════════════════════════════ */}
            {view === "result" && (
              <div className="animate-slide-up space-y-4">
                {/* Breadcrumb */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button onClick={goBackToDashboard} className="btn-ghost rounded-lg px-2.5 py-1 flex items-center gap-1 text-xs">
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                  <ChevronRight className="w-3 h-3 text-slate-700" />
                  <span className="text-slate-500">{selectedExercise?.name}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700" />
                  <span className="font-bold text-white">Q{selectedQuestion}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700" />
                  <span className={`font-medium ${solutionType === "hint" ? "text-amber-400" : "text-emerald-400"}`}>
                    {solutionType === "hint" ? "📐 Formula & Hint" : "⚡ Full Solution"}
                  </span>
                </div>

                {/* Result Card */}
                <div className="gradient-border">
                  <div className="glass rounded-[1.2rem] overflow-hidden">
                    {/* Card Header */}
                    <div className={`px-6 py-3.5 flex items-center gap-2.5 border-b border-white/[0.03] ${solutionType === "hint" ? "bg-amber-500/[0.03]" : "bg-emerald-500/[0.03]"}`}>
                      {solutionType === "hint" ? (
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Zap className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="text-sm font-semibold text-slate-200">
                        {selectedExercise?.name} — Question {selectedQuestion}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 sm:p-8">
                      {solverLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-5">
                          <div className="relative flex items-center justify-center">
                            <div className="spinner-ring" />
                            {solutionType === "hint" ? (
                              <Lightbulb className="w-5 h-5 text-amber-400 absolute" />
                            ) : (
                              <Zap className="w-5 h-5 text-emerald-400 absolute" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {solutionType === "hint" ? "Finding the right formulas..." : "Working through the solution..."}
                          </p>
                        </div>
                      ) : (
                        <div className="prose-dark text-sm overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {solutionResult || ""}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    {!solverLoading && solutionResult && (
                      <div className="px-6 py-3.5 border-t border-white/[0.03] flex flex-wrap gap-2 items-center">
                        {solutionType === "hint" && (
                          <button
                            onClick={() => fetchSolution("solution")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 glass-hover rounded-lg"
                          >
                            <Zap className="w-3 h-3" /> Show Full Solution
                          </button>
                        )}
                        {solutionType === "solution" && (
                          <button
                            onClick={() => fetchSolution("hint")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 glass-hover rounded-lg"
                          >
                            <Lightbulb className="w-3 h-3" /> Show Hint Instead
                          </button>
                        )}
                        <button
                          onClick={goBackToDashboard}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 glass-hover rounded-lg ml-auto"
                        >
                          Pick Another Question →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
