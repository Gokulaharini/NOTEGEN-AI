import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  ArrowRight, 
  ShieldAlert, 
  TrendingUp, 
  RotateCcw,
  Sparkles,
  Clock,
  BookOpen,
  Award,
  ChevronRight
} from 'lucide-react';
import { AnalysisResult, TopicPerformance, QuizQuestion } from '../types';
import { TopicRevisionModal } from './active-learning/TopicRevisionModal';

interface WeaknessViewProps {
  result: AnalysisResult;
  userQuizAnswers: Record<string, number>;
  masteredFlashcards: Set<string>;
  onGoToPractice: () => void;
  onGoToCramSheet: () => void;
  onResetQuiz: () => void;
  studyContext?: string;
  fileData?: string;
  mimeType?: string;
}

export const WeaknessView: React.FC<WeaknessViewProps> = ({
  result,
  userQuizAnswers,
  masteredFlashcards,
  onGoToPractice,
  onGoToCramSheet,
  onResetQuiz,
  studyContext,
  fileData,
  mimeType,
}) => {
  const { practiceQuiz, flashcards, prioritizationMatrix } = result;

  const [activeTopicFilter, setActiveTopicFilter] = useState<'all' | 'weak' | 'moderate' | 'strong'>('all');
  const [selectedTopicForRevision, setSelectedTopicForRevision] = useState<TopicPerformance | null>(null);
  const [remediatedTopics, setRemediatedTopics] = useState<Set<string>>(new Set());

  // 1. Calculate Score & Performance Metrics from ACTUAL quiz results
  const totalQuestions = practiceQuiz.length;
  const answeredQuestions = practiceQuiz.filter((q) => userQuizAnswers[q.id] !== undefined);
  const answeredCount = answeredQuestions.length;

  let correctCount = 0;
  const missedQuestions: QuizQuestion[] = [];

  answeredQuestions.forEach((q) => {
    const selected = userQuizAnswers[q.id];
    if (selected === q.correctIndex) {
      correctCount += 1;
    } else {
      missedQuestions.push(q);
    }
  });

  const incorrectCount = answeredCount - correctCount;
  const percentageScore = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // 2. Group Performance by Topic
  const topicMap: Record<string, { total: number; correct: number; missed: QuizQuestion[] }> = {};

  answeredQuestions.forEach((q) => {
    const t = q.topicReference || 'General Core Concepts';
    if (!topicMap[t]) {
      topicMap[t] = { total: 0, correct: 0, missed: [] };
    }
    topicMap[t].total += 1;
    if (userQuizAnswers[q.id] === q.correctIndex) {
      topicMap[t].correct += 1;
    } else {
      topicMap[t].missed.push(q);
    }
  });

  // Convert to TopicPerformance array
  const topicPerformances: TopicPerformance[] = Object.entries(topicMap).map(([topic, stat]) => {
    const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    
    // Status classification:
    // Strong: accuracy >= 75%
    // Moderate: 50% <= accuracy < 75%
    // Weak: accuracy < 50%
    let status: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';
    if (accuracy >= 75) status = 'Strong';
    else if (accuracy < 50) status = 'Weak';

    // If student remediated this topic via mini-quiz, upgrade status
    if (remediatedTopics.has(topic) && status === 'Weak') {
      status = 'Moderate';
    }

    // Reason it needs revision
    let reason = 'Solid conceptual grasp demonstrated on this topic.';
    let recommendedRevisionTime = '5 mins';

    const isHighYield = prioritizationMatrix.highYieldTopics.some((hy) =>
      hy.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(hy.toLowerCase())
    );

    if (status === 'Weak') {
      recommendedRevisionTime = isHighYield ? '20 mins' : '15 mins';
      reason = isHighYield
        ? `Missed ${stat.missed.length} question(s) on a High-Yield concept. In exams, losing points here carries severe grade penalties.`
        : `Missed ${stat.missed.length} question(s). Foundational principles require clarification before taking the exam.`;
    } else if (status === 'Moderate') {
      recommendedRevisionTime = '10 mins';
      reason = `Inconsistent recall (${stat.correct}/${stat.total} correct). Review edge-cases and boundary conditions to avoid examiner traps.`;
    }

    return {
      topic,
      total: stat.total,
      correct: stat.correct,
      incorrect: stat.total - stat.correct,
      accuracy,
      status,
      reason,
      recommendedRevisionTime,
      missedQuestions: stat.missed,
    };
  });

  const strongTopics = topicPerformances.filter((tp) => tp.status === 'Strong');
  const moderateTopics = topicPerformances.filter((tp) => tp.status === 'Moderate');
  const weakTopics = topicPerformances.filter((tp) => tp.status === 'Weak');

  const filteredTopicPerformances = topicPerformances.filter((tp) => {
    if (activeTopicFilter === 'weak') return tp.status === 'Weak';
    if (activeTopicFilter === 'moderate') return tp.status === 'Moderate';
    if (activeTopicFilter === 'strong') return tp.status === 'Strong';
    return true;
  });

  // Dynamic Exam Readiness Composite Score
  const quizWeight = 0.65;
  const flashcardWeight = 0.35;
  const flashcardMastery = flashcards.length > 0 ? (masteredFlashcards.size / flashcards.length) : 0;
  const compositeScore = Math.round(
    ((percentageScore / 100 * quizWeight) + (flashcardMastery * flashcardWeight)) * 100
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Quiz Results Summary Header (Exact requirements: Total, Correct, Incorrect, Percentage) */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              <span>Diagnostic Weak Topic Analyzer</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Exam Weakness & Performance Diagnosis
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Calculated strictly from your actual quiz answers. Evaluates conceptual vulnerabilities and generates targeted remedial sessions.
            </p>
          </div>

          {/* Readiness Meter Gauge */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 items-center justify-center rounded-3xl border border-indigo-500/30 bg-slate-950 shadow-xl">
            <div className="text-center">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono block ${
                  compositeScore >= 75
                    ? 'text-emerald-400'
                    : compositeScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {compositeScore}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Exam Ready
              </span>
            </div>
          </div>
        </div>

        {/* 4 Score Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Total Questions
            </span>
            <span className="text-2xl font-black text-white font-mono">
              {answeredCount} <span className="text-xs text-slate-500">/ {totalQuestions}</span>
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
              Correct Answers
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {correctCount}
            </span>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
              Incorrect Answers
            </span>
            <span className="text-2xl font-black text-rose-400 font-mono">
              {incorrectCount}
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
              Percentage Score
            </span>
            <span className="text-2xl font-black text-indigo-300 font-mono">
              {percentageScore}%
            </span>
          </div>
        </div>

        {/* If no questions answered yet */}
        {answeredCount === 0 && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 text-center space-y-3">
            <p className="text-xs sm:text-sm text-indigo-200">
              You haven&apos;t answered any quiz questions yet! Take the Practice Quiz to reveal your Strong, Moderate, and Weak topic breakdown.
            </p>
            <button
              onClick={onGoToPractice}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Start Practice Quiz Now</span>
            </button>
          </div>
        )}
      </section>

      {/* TOPIC GROUPINGS (Strong Topics, Moderate Topics, Weak Topics) */}
      {answeredCount > 0 && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Topic Performance Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Grouped by accuracy: Strong (&ge;75%), Moderate (50-74%), and Weak (&lt;50%)
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs">
              <button
                onClick={() => setActiveTopicFilter('all')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTopicFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Topics ({topicPerformances.length})
              </button>

              <button
                onClick={() => setActiveTopicFilter('weak')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTopicFilter === 'weak'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Weak</span>
                <span className="rounded-full bg-rose-950/80 px-1.5 py-0.2 text-[10px] font-mono">
                  {weakTopics.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTopicFilter('moderate')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTopicFilter === 'moderate'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Moderate</span>
                <span className="rounded-full bg-amber-950/80 px-1.5 py-0.2 text-[10px] font-mono">
                  {moderateTopics.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTopicFilter('strong')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTopicFilter === 'strong'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Strong</span>
                <span className="rounded-full bg-emerald-950/80 px-1.5 py-0.2 text-[10px] font-mono">
                  {strongTopics.length}
                </span>
              </button>
            </div>
          </div>

          {/* WEAK TOPICS SECTION (Mandatory fields: Topic name, Quiz accuracy, Reason it needs revision, Recommended revision time, "Revise This Topic" button) */}
          <div className="space-y-4">
            {weakTopics.length > 0 && (activeTopicFilter === 'all' || activeTopicFilter === 'weak') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Weak Topics Requiring Attention ({weakTopics.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-950 p-6 shadow-xl space-y-4 transition-all hover:border-rose-500/60"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                              Weak Topic
                            </span>
                            <span className="text-xs text-slate-400">
                              {wt.correct}/{wt.total} Questions Correct
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white">
                            {wt.topic}
                          </h4>
                        </div>

                        {/* Accuracy & Revision Time Badges */}
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-center">
                            <span className="text-[10px] text-rose-400 font-bold uppercase block">Accuracy</span>
                            <span className="text-sm font-black text-rose-300 font-mono">{wt.accuracy}%</span>
                          </div>

                          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-center">
                            <span className="text-[10px] text-amber-400 font-bold uppercase block">Revision Time</span>
                            <span className="text-sm font-black text-amber-300 font-mono">{wt.recommendedRevisionTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reason it needs revision */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs">
                        <span className="font-bold text-rose-300 uppercase tracking-wider block mb-1 text-[10px]">
                          Why This Needs Revision:
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {wt.reason}
                        </p>
                      </div>

                      {/* Action Button: "Revise This Topic" */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <span className="text-xs text-slate-400">
                          Generates targeted mental models, tricky exam traps, and a 3-question recovery mini-quiz
                        </span>

                        <button
                          onClick={() => setSelectedTopicForRevision(wt)}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Revise This Topic</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODERATE TOPICS */}
            {moderateTopics.length > 0 && (activeTopicFilter === 'all' || activeTopicFilter === 'moderate') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4" />
                  <span>Moderate Topics — Needs Reinforcement ({moderateTopics.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {moderateTopics.map((mt, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-5 space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Moderate
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {mt.topic}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {mt.accuracy}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {mt.reason}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-400">
                          Study: {mt.recommendedRevisionTime}
                        </span>

                        <button
                          onClick={() => setSelectedTopicForRevision(mt)}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
                        >
                          <span>Revise Concept</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STRONG TOPICS */}
            {strongTopics.length > 0 && (activeTopicFilter === 'all' || activeTopicFilter === 'strong') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Strong Topics — Exam Ready ({strongTopics.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {strongTopics.map((st, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5 space-y-2 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                            Mastered
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {st.topic}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {st.accuracy}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {st.correct}/{st.total} questions answered correctly. High confidence on core exam definitions.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Missed Questions Audit with Answers */}
      {missedQuestions.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Detailed Missed Questions Audit ({missedQuestions.length})
              </h4>
            </div>
            <button
              onClick={onResetQuiz}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retake Quiz</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {missedQuestions.map((q) => {
              const selectedIdx = userQuizAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-rose-500/30 bg-slate-950/70 p-4.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <span className="font-semibold text-white">
                      {q.question}
                    </span>
                    <span className="text-[10px] text-rose-300 font-mono flex-shrink-0">
                      Topic: {q.topicReference}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-300">
                      <span className="font-bold block text-[10px] uppercase text-rose-400 mb-0.5">
                        Your Incorrect Selection:
                      </span>
                      {selectedIdx !== undefined ? `${String.fromCharCode(65 + selectedIdx)}: ${q.options[selectedIdx]}` : 'None'}
                    </div>

                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-300">
                      <span className="font-bold block text-[10px] uppercase text-emerald-400 mb-0.5">
                        Correct Answer:
                      </span>
                      {String.fromCharCode(65 + q.correctIndex)}: {q.options[q.correctIndex]}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                    <strong className="text-slate-300">Examiner Rationale:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Target Cram Action Bar */}
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 flex-shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Ready for the Final Pre-Exam Review?
            </h4>
            <p className="text-xs text-slate-400">
              Print or scan the ultra-condensed 5-Minute Cram Sheet with all high-yield formulas and definitions.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToCramSheet}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all flex-shrink-0"
        >
          <span>Open 5-Minute Cram Sheet</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* REVISION SESSION MODAL (Triggered by "Revise This Topic") */}
      {selectedTopicForRevision && (
        <TopicRevisionModal
          topicData={selectedTopicForRevision}
          studyContext={studyContext || result.summary.quickSummary}
          fileData={fileData}
          mimeType={mimeType}
          onClose={() => setSelectedTopicForRevision(null)}
          onTopicRemediated={(remediatedTopicName) => {
            setRemediatedTopics((prev) => new Set([...prev, remediatedTopicName]));
          }}
        />
      )}
    </div>
  );
};
