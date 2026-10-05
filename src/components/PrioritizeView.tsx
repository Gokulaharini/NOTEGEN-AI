import React from 'react';
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface PrioritizeViewProps {
  result: AnalysisResult;
  onGoToPractice: () => void;
}

export const PrioritizeView: React.FC<PrioritizeViewProps> = ({ result, onGoToPractice }) => {
  const { prioritizationMatrix } = result;

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Strategy Card */}
      <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-6 sm:p-7 shadow-xl">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Exam Prioritization & Yield Strategy
            </h3>
            <p className="text-xs text-slate-400">
              Where to allocate your study hours for maximum grade payoff
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4 text-sm leading-relaxed text-slate-200">
          {prioritizationMatrix.focusSummary}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Based on structural analysis of {result.metadata.totalTopicsCount} core topics
          </span>
          <button
            onClick={onGoToPractice}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <span>Test High-Yield in Practice Arena</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Yield Distribution Columns */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* High Yield */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              High-Yield Topics
            </span>
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              Must Master
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Highest probability of appearing as long-form questions, proofs, or complex scenarios.
          </p>
          <ul className="space-y-2">
            {prioritizationMatrix.highYieldTopics.map((topic, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-slate-900/60 p-2.5 text-xs font-medium text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medium Yield */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Medium-Yield Topics
            </span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Foundational
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Core mechanisms, standard definitions, and essential stepping stones for high-yield questions.
          </p>
          <ul className="space-y-2">
            {prioritizationMatrix.mediumYieldTopics.map((topic, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-slate-900/60 p-2.5 text-xs font-medium text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Low Yield */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              Low-Yield / Context
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              Quick Scan
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Historical background or supplementary remarks. Review only after mastering high/medium topics.
          </p>
          <ul className="space-y-2">
            {prioritizationMatrix.lowYieldTopics.length > 0 ? (
              prioritizationMatrix.lowYieldTopics.map((topic, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-xs font-medium text-slate-300"
                >
                  <span className="text-slate-500">•</span>
                  <span>{topic}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic p-2">
                All extracted topics hold medium or high exam significance.
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Time Allocation Advice */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Recommended Study Time Allocation
            </h3>
            <p className="text-xs text-slate-400">
              Smart scheduling guide based on conceptual density and difficulty
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {prioritizationMatrix.timeAllocationAdvice.map((advice, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">
                  {advice.topic}
                </span>
                <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-300">
                  {advice.percentage}% of time
                </span>
              </div>

              {/* Progress bar visual */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 mb-2.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                  style={{ width: `${Math.min(advice.percentage, 100)}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {advice.rationale}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Examiner Pitfalls & Traps */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300 tracking-tight">
              Examiner Traps & Common Student Mistakes
            </h3>
            <p className="text-xs text-amber-200/70">
              Sneaky questions and common misconceptions examiners test for
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {prioritizationMatrix.examinerPitfalls.map((pitfall, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-amber-500/20 bg-slate-950/70 p-4 space-y-2"
            >
              <span className="font-bold text-xs text-white block">
                {pitfall.topic}
              </span>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                <span className="font-semibold block text-[10px] uppercase text-rose-400 mb-0.5">
                  The Trap:
                </span>
                {pitfall.trap}
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                <span className="font-semibold block text-[10px] uppercase text-emerald-400 mb-0.5">
                  How to answer correctly:
                </span>
                {pitfall.howToAvoid}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
