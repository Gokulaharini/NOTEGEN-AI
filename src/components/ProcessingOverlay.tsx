import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, CheckCircle2, BookOpen, Target, Layers } from 'lucide-react';
import { ExplanationLevel } from '../types';

interface ProcessingOverlayProps {
  level: ExplanationLevel;
  fileName: string;
}

const STEPS = [
  { id: 1, label: 'Reading and parsing source document structure', icon: BookOpen },
  { id: 2, label: 'Extracting key concepts, genuine formulas & definitions', icon: Brain },
  { id: 3, label: 'Synthesizing concise notes & exam revision points', icon: Layers },
  { id: 4, label: 'Evaluating topic weightage & examiner pitfall traps', icon: Target },
  { id: 5, label: 'Formulating adaptive quiz & active recall flashcards', icon: Sparkles },
];

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ level, fileName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 text-center">
        {/* Glowing Orb Animation */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-xl shadow-indigo-500/30 animate-pulse">
          <Brain className="h-10 w-10 text-white animate-bounce" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white">
          Transforming Study Material
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Source: <span className="text-indigo-300 font-medium">{fileName}</span> • Level: <span className="uppercase text-amber-300 font-semibold">{level}</span>
        </p>

        {/* Dynamic Progress Steps */}
        <div className="mt-7 space-y-3 text-left">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-xl p-2.5 transition-all duration-300 ${
                  isCurrent
                    ? 'border border-indigo-500/40 bg-indigo-500/10'
                    : isCompleted
                    ? 'opacity-80'
                    : 'opacity-30'
                }`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-indigo-500/20 text-indigo-400 animate-spin'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-indigo-200 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-400">
          NoteGen AI uses Google Gemini 3.8 Flash to extract authentic definitions and formulas without hallucinations.
        </div>
      </div>
    </div>
  );
};
