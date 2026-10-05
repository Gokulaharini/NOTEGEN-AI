import React, { useEffect, useState } from 'react';
import { 
  X, 
  Brain, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Bookmark, 
  Loader2, 
  Award, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TopicPerformance, TopicRevisionSession } from '../../types';

interface TopicRevisionModalProps {
  topicData: TopicPerformance;
  studyContext?: string;
  fileData?: string;
  mimeType?: string;
  onClose: () => void;
  onTopicRemediated?: (topicName: string) => void;
}

export const TopicRevisionModal: React.FC<TopicRevisionModalProps> = ({
  topicData,
  studyContext,
  fileData,
  mimeType,
  onClose,
  onTopicRemediated,
}) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<TopicRevisionSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mini quiz state
  const [miniQuizAnswers, setMiniQuizAnswers] = useState<Record<string, number>>({});
  const [currentMiniQIdx, setCurrentMiniQIdx] = useState(0);
  const [miniQuizFinished, setMiniQuizFinished] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRevision = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/revise-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicData.topic,
            accuracy: topicData.accuracy,
            missedQuestions: topicData.missedQuestions.map((q) => ({
              question: q.question,
              explanation: q.explanation,
            })),
            studyContext,
            fileData,
            mimeType,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate topic revision session.');
        }

        const data: TopicRevisionSession = await res.json();
        if (isMounted) {
          setSession(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error creating revision session.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRevision();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [topicData, studyContext, fileData, mimeType, onClose]);

  const handleMiniAnswer = (questionId: string, optIdx: number) => {
    if (miniQuizAnswers[questionId] !== undefined) return;

    setMiniQuizAnswers((prev) => {
      const next = { ...prev, [questionId]: optIdx };
      const answeredCount = Object.keys(next).length;
      const totalQ = session?.miniQuiz.length || 0;

      if (answeredCount === totalQ && totalQ > 0) {
        let correct = 0;
        session?.miniQuiz.forEach((q) => {
          if (next[q.id] === q.correctIndex) correct++;
        });

        if (correct === totalQ) {
          confetti({
            particleCount: 90,
            spread: 60,
            origin: { y: 0.6 },
          });
          if (onTopicRemediated) {
            onTopicRemediated(topicData.topic);
          }
        }
        setMiniQuizFinished(true);
      }
      return next;
    });
  };

  const handleRetakeMiniQuiz = () => {
    setMiniQuizAnswers({});
    setCurrentMiniQIdx(0);
    setMiniQuizFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Targeted Weak Topic Revision
                </span>
                <span className="rounded bg-rose-500/20 px-2 py-0.2 text-[10px] font-bold text-rose-300 font-mono">
                  Accuracy: {topicData.accuracy}%
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate max-w-lg">
                {topicData.topic}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">Synthesizing Focused Topic Revision...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Extracting core principles, resolving misconceptions, and generating diagnostic mini-quiz
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300">
              <p className="font-bold">Failed to load revision session:</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && session && (
            <>
              {/* Recommended Study Time Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>Recommended Revision Investment:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {session.recommendedStudyTime || topicData.recommendedRevisionTime || '15 minutes'}
                  </span>
                </div>

                <span className="text-[11px] text-indigo-300 font-medium">
                  Focused Strategy Session
                </span>
              </div>

              {/* 1. Focused Explanation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <h4 className="text-sm font-bold text-white">
                    1. High-Yield Concept Breakdown
                  </h4>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-line">
                  {session.conceptBreakdown}
                </div>
              </div>

              {/* 2. Key Terms or Formulas */}
              {session.keyFormulasOrTerms && session.keyFormulasOrTerms.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      2. Must-Remember Terms & Formulas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {session.keyFormulasOrTerms.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs"
                      >
                        <span className="font-bold text-emerald-400 block mb-1">
                          {item.term}
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Examiner Traps */}
              {session.commonExaminerTraps && session.commonExaminerTraps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      3. Sneaky Examiner Traps
                    </h4>
                  </div>
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4.5 space-y-2 text-xs">
                    {session.commonExaminerTraps.map((trap, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-amber-200">
                        <span className="font-mono text-amber-400 font-bold">•</span>
                        <span className="leading-relaxed">{trap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Diagnostic Mini-Quiz */}
              {session.miniQuiz && session.miniQuiz.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">
                        4. Diagnostic Mastery Mini-Quiz (3 Questions)
                      </h4>
                    </div>
                    {miniQuizFinished && (
                      <button
                        onClick={handleRetakeMiniQuiz}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Retake</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Test your understanding right now to verify that your misconceptions on this topic are cleared.
                  </p>

                  <div className="space-y-5">
                    {session.miniQuiz.map((mq, mqIdx) => {
                      const ans = miniQuizAnswers[mq.id];
                      const isAnswered = ans !== undefined;
                      const isCorrect = isAnswered && ans === mq.correctIndex;

                      return (
                        <div
                          key={mq.id}
                          className={`rounded-2xl border p-4.5 space-y-3.5 transition-all ${
                            isAnswered
                              ? isCorrect
                                ? 'border-emerald-500/40 bg-slate-950/90'
                                : 'border-rose-500/40 bg-slate-950/90'
                              : 'border-slate-800 bg-slate-950/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                              {mqIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-white">
                              {mq.question}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {mq.options.map((opt, optIdx) => {
                              const isSelected = ans === optIdx;
                              const isOptCorrect = mq.correctIndex === optIdx;

                              let optClass = 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800';
                              if (isAnswered) {
                                if (isOptCorrect) {
                                  optClass = 'border-emerald-500 bg-emerald-950/30 text-emerald-200 font-medium';
                                } else if (isSelected && !isOptCorrect) {
                                  optClass = 'border-rose-500 bg-rose-950/30 text-rose-200 font-medium';
                                } else {
                                  optClass = 'border-slate-800/40 opacity-50 text-slate-500';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={isAnswered}
                                  onClick={() => handleMiniAnswer(mq.id, optIdx)}
                                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${optClass}`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </div>

                                  {isAnswered && isOptCorrect && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                  )}
                                  {isAnswered && isSelected && !isOptCorrect && (
                                    <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div
                              className={`rounded-xl border p-3 text-xs ${
                                isCorrect
                                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                                  : 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                              }`}
                            >
                              <strong className="block mb-0.5">
                                {isCorrect ? '✓ Correct!' : `✗ Incorrect — Option ${String.fromCharCode(65 + mq.correctIndex)} is correct`}
                              </strong>
                              <span className="text-slate-300">{mq.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            NoteGen AI • Personalized Remedial Engine
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
