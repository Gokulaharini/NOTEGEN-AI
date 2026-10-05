import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Loader2,
  BookOpen,
  Compass,
  FileText,
  Sliders,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { 
  AnalysisResult, 
  ExamIntelligenceProfile, 
  ExamIntelligencePlan, 
  QuizQuestion 
} from '../../types';

interface ExamIntelligenceViewProps {
  result: AnalysisResult;
  userQuizAnswers: Record<string, number>;
  onGoToPractice: () => void;
  onGoToEmergency: () => void;
  studyContext?: string;
  fileData?: string;
  mimeType?: string;
}

export const ExamIntelligenceView: React.FC<ExamIntelligenceViewProps> = ({
  result,
  userQuizAnswers,
  onGoToPractice,
  onGoToEmergency,
  studyContext,
  fileData,
  mimeType,
}) => {
  // Compute default exam date (7 days from now)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const formattedDefaultDate = defaultDate.toISOString().split('T')[0];

  const [profile, setProfile] = useState<ExamIntelligenceProfile>({
    subject: result.metadata.subject || 'Core Academic Subject',
    examDate: formattedDefaultDate,
    dailyStudyHours: 2,
    confidenceLevel: 'Moderate',
    syllabusWeightage: '',
  });

  const [loading, setLoading] = useState(false);
  const [intelligencePlan, setIntelligencePlan] = useState<ExamIntelligencePlan | null>(null);

  // Extract quiz performance and weak topics
  const answeredCount = Object.keys(userQuizAnswers).length;
  let correctCount = 0;
  const weakTopics: string[] = [];

  result.practiceQuiz.forEach((q) => {
    const ans = userQuizAnswers[q.id];
    if (ans !== undefined) {
      if (ans === q.correctIndex) {
        correctCount += 1;
      } else {
        if (q.topicReference && !weakTopics.includes(q.topicReference)) {
          weakTopics.push(q.topicReference);
        }
      }
    }
  });

  const quizAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Days remaining calculation
  const calculateDaysRemaining = (examDateStr: string) => {
    const target = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysRemaining(profile.examDate);

  // Generate strategy
  const handleGenerateStrategy = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/exam-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          studyContext: studyContext || result.summary.quickSummary,
          quizStats: {
            totalQuestions: result.practiceQuiz.length,
            answeredCount,
            correctCount,
            accuracy: quizAccuracy,
          },
          weakTopics,
          fileData,
          mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate exam intelligence strategy');
      }

      const data: ExamIntelligencePlan = await res.json();
      setIntelligencePlan(data);
    } catch (err) {
      console.error('[NoteGen AI] Exam intelligence error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate initial strategy on mount
  useEffect(() => {
    handleGenerateStrategy();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-0.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Strategic Exam Intelligence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Personalized Exam Blueprint & Priority Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated against your target exam date, daily study capacity, syllabus weightage, and quiz diagnostics.
          </p>
        </div>

        {/* Emergency Shortcut Button */}
        <button
          onClick={onGoToEmergency}
          className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>⚡ Emergency Crunch: I Have Only 30 Mins</span>
        </button>
      </div>

      {/* STUDENT CONSTRAINT INPUT PANEL */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Enter Your Exam Target & Constraints
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {daysRemaining} Days Until Exam
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Subject Name:
            </label>
            <input
              type="text"
              value={profile.subject}
              onChange={(e) => setProfile({ ...profile, subject: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g. Operating Systems"
            />
          </div>

          {/* Exam Date */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Exam Date:
            </label>
            <div className="relative">
              <input
                type="date"
                value={profile.examDate}
                onChange={(e) => setProfile({ ...profile, examDate: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Daily Study Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Available Daily Study Time:
            </label>
            <select
              value={profile.dailyStudyHours}
              onChange={(e) => setProfile({ ...profile, dailyStudyHours: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value={1}>1 hour / day</option>
              <option value={2}>2 hours / day</option>
              <option value={3}>3 hours / day</option>
              <option value={4}>4 hours / day</option>
              <option value={6}>6+ hours / day (Full Cram)</option>
            </select>
          </div>

          {/* Confidence Level */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Current Confidence:
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
              {(['Low', 'Moderate', 'High'] as const).map((conf) => (
                <button
                  key={conf}
                  type="button"
                  onClick={() => setProfile({ ...profile, confidenceLevel: conf })}
                  className={`rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                    profile.confidenceLevel === conf
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {conf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Syllabus & Weightage */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Optional Syllabus Weightage / Module Marks (Optional):
          </label>
          <input
            type="text"
            value={profile.syllabusWeightage}
            onChange={(e) => setProfile({ ...profile, syllabusWeightage: e.target.value })}
            placeholder="e.g. Unit 3 (Paging) is 40% of marks, Unit 4 (Deadlocks) is 20%, Unit 1 is 10%"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Generate / Recalculate Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Quiz Diagnostic Input:</span>
            <span className="font-bold text-white">{answeredCount} Answered</span>
            <span>•</span>
            <span className={`font-bold ${quizAccuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {quizAccuracy}% Accuracy
            </span>
            {weakTopics.length > 0 && (
              <span className="text-rose-400 font-medium">({weakTopics.length} Weak Topics Factored)</span>
            )}
          </div>

          <button
            onClick={handleGenerateStrategy}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Synthesizing Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Update Exam Strategy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STRATEGIC OUTPUTS */}
      {intelligencePlan && (
        <div className="space-y-8">
          {/* Executive Readiness Summary */}
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Exam Readiness Verdict & Budget
                  </h4>
                  <p className="text-xs text-slate-400">
                    Calculated for {daysRemaining} days remaining at {profile.dailyStudyHours} hrs/day
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                  Recommended Total Prep Time
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {intelligencePlan.totalRecommendedStudyHours} Hours
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed border-t border-slate-800/80 pt-3">
              {intelligencePlan.examReadinessSummary}
            </p>
          </div>

          {/* PRIORITY TOPICS MATRIX (High, Medium, Low Priority) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Priority Stratification Matrix
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Sorted by exam impact, syllabus weight, and conceptual difficulty
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* HIGH PRIORITY */}
              <div className="rounded-3xl border border-rose-500/40 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      High Priority ({intelligencePlan.highPriorityTopics.length})
                    </h4>
                  </div>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    Must Master
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligencePlan.highPriorityTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-rose-500/20 bg-rose-950/15 p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.topic}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30 whitespace-nowrap">
                          {item.timeAllocation}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">
                        {item.whyPriority}
                      </p>

                      <div className="text-[11px] text-rose-300 font-medium pt-1">
                        Target Yield: {item.targetMarksOrYield}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MEDIUM PRIORITY */}
              <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-amber-500" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Medium Priority ({intelligencePlan.mediumPriorityTopics.length})
                    </h4>
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Foundational
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligencePlan.mediumPriorityTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.topic}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                          {item.timeAllocation}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">
                        {item.whyPriority}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOW PRIORITY */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-slate-500" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Low Priority ({intelligencePlan.lowPriorityTopics.length})
                    </h4>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    Quick Skim
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligencePlan.lowPriorityTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.topic}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap">
                          {item.timeAllocation}
                        </span>
                      </div>

                      <p className="text-slate-400 leading-relaxed">
                        {item.whyPriority}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RECOMMENDED REVISION ORDER (Step 1 -> Step 2 -> Step 3) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Chronological Recommended Revision Order
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Optimized study sequence from Day 1 to Exam Day
              </span>
            </div>

            <div className="space-y-3">
              {intelligencePlan.recommendedRevisionOrder.map((stepItem) => {
                let phaseBadge = 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
                if (stepItem.phase === 'High-Yield Drill') phaseBadge = 'border-rose-500/30 bg-rose-500/10 text-rose-300';
                if (stepItem.phase === 'Edge-Case Polish') phaseBadge = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
                if (stepItem.phase === 'Mock Test') phaseBadge = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';

                return (
                  <div
                    key={stepItem.step}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 font-mono text-xs font-bold text-white border border-slate-800">
                        {stepItem.step}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="text-sm font-bold text-white">
                            {stepItem.topic}
                          </h5>
                          <span className={`rounded px-2 py-0.2 text-[10px] font-bold border ${phaseBadge}`}>
                            {stepItem.phase}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {stepItem.objective}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-xl whitespace-nowrap">
                        {stepItem.duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MANDATORY DISCLAIMER STAMP */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Academic Notice & Disclaimer:</strong> NoteGen AI synthesizes syllabus recommendations based on academic frequency patterns and high-yield concepts from your uploaded study materials. <em>No topic is guaranteed to appear in an official exam.</em> Always verify the mandatory syllabus requirements set by your academic board or university institution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
