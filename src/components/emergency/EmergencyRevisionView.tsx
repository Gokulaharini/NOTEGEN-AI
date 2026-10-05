import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  Printer, 
  Layers, 
  HelpCircle, 
  AlertTriangle,
  Loader2,
  Zap,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmergencyDuration, EmergencyRevisionPlan, EmergencyBlock, AnalysisResult } from '../../types';

interface EmergencyRevisionViewProps {
  result: AnalysisResult;
  userQuizAnswers: Record<string, number>;
  onGoToFlashcards?: () => void;
  onGoToQuiz?: () => void;
  studyContext?: string;
}

export const EmergencyRevisionView: React.FC<EmergencyRevisionViewProps> = ({
  result,
  userQuizAnswers,
  onGoToFlashcards,
  onGoToQuiz,
  studyContext,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<EmergencyDuration>(30);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<EmergencyRevisionPlan | null>(null);
  const [copied, setCopied] = useState(false);

  // Active Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30 * 60);

  // Identify weak topics from quiz answers
  const weakTopics: string[] = [];
  result.practiceQuiz.forEach((q) => {
    const ans = userQuizAnswers[q.id];
    if (ans !== undefined && ans !== q.correctIndex) {
      if (q.topicReference && !weakTopics.includes(q.topicReference)) {
        weakTopics.push(q.topicReference);
      }
    }
  });

  const highYieldTopics = result.prioritizationMatrix.highYieldTopics || [];

  // Function to generate the emergency plan
  const fetchEmergencyPlan = async (duration: EmergencyDuration) => {
    try {
      setLoading(true);
      setIsTimerRunning(false);
      setSecondsRemaining(duration * 60);

      const res = await fetch('/api/emergency-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes: duration,
          weakTopics,
          highYieldTopics,
          subject: result.metadata.subject,
          studyContext: studyContext || result.summary.quickSummary,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate emergency revision plan');
      }

      const data: EmergencyRevisionPlan = await res.json();
      setPlan(data);
    } catch (err) {
      console.error('[NoteGen AI] Emergency plan error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate default 30-min plan on initial mount
  useEffect(() => {
    fetchEmergencyPlan(selectedDuration);
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const handleDurationChange = (dur: EmergencyDuration) => {
    setSelectedDuration(dur);
    fetchEmergencyPlan(dur);
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(selectedDuration * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine current active block based on elapsed time
  const totalSeconds = selectedDuration * 60;
  const elapsedMinutes = (totalSeconds - secondsRemaining) / 60;
  const currentBlockIndex = plan?.blocks.findIndex(
    (b) => elapsedMinutes >= b.startMin && elapsedMinutes < b.endMin
  );

  const handleCopyPlan = () => {
    if (!plan) return;
    const text = [
      `=== NoteGen AI Emergency Revision Plan (${selectedDuration} Mins) ===`,
      `Subject: ${result.metadata.subject}`,
      `Strategy: ${plan.executiveStrategy}`,
      '',
      ...plan.blocks.map(
        (b) => `[${b.timeRange}] (${b.activityType}) ${b.topic}\n  Task: ${b.actionableTask}\n  Key Tip: ${b.quickMnemonicOrKeyPoint}`
      ),
      '',
      `Final Words: ${plan.finalWordsOfWisdom}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HERO BANNER: "I HAVE ONLY 30 MINUTES" */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/50 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-rose-300 animate-pulse">
              <Flame className="h-4 w-4 text-rose-400" />
              <span>Emergency Crunch Mode</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-rose-300 font-semibold bg-rose-950/60 border border-rose-500/30 px-3 py-1 rounded-xl">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Strict Time Guarantee: Plan never exceeds selected duration</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              &ldquo;I HAVE ONLY {selectedDuration} MINUTES!&rdquo;
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Cut through non-essential theory. NoteGen AI analyzes your weak topics, high-yield traps, and available time to construct a ruthlessly focused survival plan.
            </p>
          </div>

          {/* DURATION PRESET BUTTONS (10 min, 20 min, 30 min, 1 hour, 2 hours) */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Select Your Exact Remaining Time:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { dur: 10, label: '10 Mins', sub: 'Lightning Sprint' },
                { dur: 20, label: '20 Mins', sub: 'High-Impact Cram' },
                { dur: 30, label: '30 Mins', sub: 'The 30-Min Lifesaver' },
                { dur: 60, label: '1 Hour', sub: 'Power Hour' },
                { dur: 120, label: '2 Hours', sub: 'Intensive Sprint' },
              ].map(({ dur, label, sub }) => {
                const isSelected = selectedDuration === dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => handleDurationChange(dur as EmergencyDuration)}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-xl shadow-rose-600/30 scale-105'
                        : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-black tracking-tight">{label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-rose-100 font-medium' : 'text-slate-500'}`}>
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE EMERGENCY STOPWATCH & CONTROLS */}
      {plan && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-600/20">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Sprint Countdown
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wider">
                  {formatTime(secondsRemaining)}
                </span>
                <span className="text-xs text-slate-400">
                  of {selectedDuration} mins
                </span>
              </div>
            </div>
          </div>

          {/* Timer Actions & Plan Exports */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 animate-pulse'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Start Emergency Sprint</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-400 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={handleCopyPlan}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60">
          <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
          <div>
            <h4 className="text-base font-bold text-white">
              Synthesizing {selectedDuration}-Minute Emergency Survival Plan...
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Calculating highest-yield concepts, integrating weak topics, and fitting exact minute boundaries.
            </p>
          </div>
        </div>
      )}

      {/* EMERGENCY PLAN CHRONOLOGICAL BLOCKS */}
      {!loading && plan && (
        <div className="space-y-6">
          {/* Executive Strategy Banner */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4.5 sm:p-5 text-xs text-indigo-200 leading-relaxed flex items-start gap-3">
            <Zap className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5 text-sm">
                Executive Cram Strategy:
              </span>
              <p>{plan.executiveStrategy}</p>
            </div>
          </div>

          {/* Chronological Timeline Blocks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Minute-by-Minute Survival Roadmap ({plan.blocks.length} Blocks • Exactly {selectedDuration} Mins)
              </span>
              <span>Total Duration: {selectedDuration} Minutes</span>
            </div>

            <div className="space-y-3">
              {plan.blocks.map((block, idx) => {
                const isActive = currentBlockIndex === idx && isTimerRunning;
                const isPassed = currentBlockIndex !== undefined && currentBlockIndex > idx && isTimerRunning;

                let activityColor = 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
                if (block.activityType === 'Weak Topic Recovery') activityColor = 'border-rose-500/30 bg-rose-500/10 text-rose-300';
                if (block.activityType === 'Flashcards Blitz') activityColor = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
                if (block.activityType === 'Rapid Quiz') activityColor = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';

                return (
                  <div
                    key={idx}
                    className={`relative rounded-3xl border p-5 sm:p-6 transition-all shadow-xl ${
                      isActive
                        ? 'border-rose-500 bg-slate-900 ring-2 ring-rose-500/50 scale-[1.01]'
                        : isPassed
                        ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center rounded-xl bg-slate-950 px-3 py-1 font-mono text-xs font-black text-rose-400 border border-slate-800">
                          {block.timeRange}
                        </span>

                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${activityColor}`}>
                          {block.activityType}
                        </span>

                        {isActive && (
                          <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            <span>CURRENT SPRINT</span>
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-xs text-slate-400">
                        Duration: {block.durationMin} mins
                      </span>
                    </div>

                    <div className="pt-3.5 space-y-2">
                      <h4 className="text-base font-bold text-white">
                        {block.topic}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <strong className="text-slate-400">Action: </strong>
                        {block.actionableTask}
                      </p>

                      {block.quickMnemonicOrKeyPoint && (
                        <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200">
                          <span className="font-bold text-amber-300 block mb-0.5">
                            Exam Mnemonic / Memory Hook:
                          </span>
                          <p>{block.quickMnemonicOrKeyPoint}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Jump Action Bar (Flashcards & Quiz Integration) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {onGoToFlashcards && (
              <button
                type="button"
                onClick={onGoToFlashcards}
                className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-left hover:border-amber-500/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Flashcard Blitz Mode</h5>
                    <p className="text-[11px] text-amber-200/80">Rapid-fire memory cards for the last 5 minutes</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </button>
            )}

            {onGoToQuiz && (
              <button
                type="button"
                onClick={onGoToQuiz}
                className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left hover:border-emerald-500/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Rapid Quiz Drill</h5>
                    <p className="text-[11px] text-emerald-200/80">Test your reflexes under pressure</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </button>
            )}
          </div>

          {/* Final Words of Wisdom */}
          {plan.finalWordsOfWisdom && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-400">
              <span className="font-bold text-white block mb-0.5">NoteGen AI Exam Room Advice:</span>
              &ldquo;{plan.finalWordsOfWisdom}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
