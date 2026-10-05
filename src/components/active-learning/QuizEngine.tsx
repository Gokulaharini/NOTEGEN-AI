import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Award, 
  AlertCircle, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Filter,
  Check,
  ChevronRight,
  Eye,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, QuestionDifficulty } from '../../types';

interface QuizEngineProps {
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onResetQuiz: () => void;
  onGoToWeakness?: () => void;
  onGenerateCustomQuiz?: (count: number, difficulty: string) => Promise<void>;
  isGenerating?: boolean;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  userAnswers,
  onAnswer,
  onResetQuiz,
  onGoToWeakness,
  onGenerateCustomQuiz,
  isGenerating = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [reviewFilterMissedOnly, setReviewFilterMissedOnly] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [genCount, setGenCount] = useState(8);
  const [genDifficulty, setGenDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // If question was already answered previously in state
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Calculate final score
  let correctCount = 0;
  const missedQuestions: QuizQuestion[] = [];
  const difficultyStats: Record<QuestionDifficulty, { total: number; correct: number }> = {
    Easy: { total: 0, correct: 0 },
    Medium: { total: 0, correct: 0 },
    Hard: { total: 0, correct: 0 },
  };

  questions.forEach((q) => {
    const diff = (q.difficulty as QuestionDifficulty) || 'Medium';
    if (!difficultyStats[diff]) {
      difficultyStats[diff] = { total: 0, correct: 0 };
    }
    difficultyStats[diff].total += 1;

    const ans = userAnswers[q.id];
    if (ans === q.correctIndex) {
      correctCount += 1;
      difficultyStats[diff].correct += 1;
    } else if (ans !== undefined) {
      missedQuestions.push(q);
    }
  });

  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Handle option click before submitting
  const handleSelectOption = (idx: number) => {
    if (hasSubmittedCurrent || userAnswers[currentQuestion?.id] !== undefined) return;
    setSelectedOption(idx);
  };

  // Submit current question answer
  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;
    onAnswer(currentQuestion.id, selectedOption);
    setHasSubmittedCurrent(true);

    // If this is the last question, trigger confetti if passing score
    if (currentQuestionIndex === totalQuestions - 1) {
      const finalCorrect = correctCount + (selectedOption === currentQuestion.correctIndex ? 1 : 0);
      if (finalCorrect / totalQuestions >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Move to next question or complete
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmittedCurrent(false);
    } else {
      setIsQuizFinished(true);
    }
  };

  const handleRetake = () => {
    onResetQuiz();
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setHasSubmittedCurrent(false);
    setIsQuizFinished(false);
  };

  const handleGenerateSubmit = async () => {
    if (onGenerateCustomQuiz) {
      setShowGeneratorModal(false);
      await onGenerateCustomQuiz(genCount, genDifficulty);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setHasSubmittedCurrent(false);
      setIsQuizFinished(false);
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'Easy':
        return <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Easy</span>;
      case 'Hard':
        return <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">Hard</span>;
      case 'Medium':
      default:
        return <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">Medium</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">AI Practice Quiz</h3>
              <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono">
                {totalQuestions} MCQs
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Exam-level multiple choice questions with rationale and difficulty tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateCustomQuiz && (
            <button
              onClick={() => setShowGeneratorModal(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>New Custom Quiz</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleRetake}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Answers</span>
          </button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span>•</span>
            <span className="text-slate-400">{answeredCount} Answered</span>
          </div>

          <span className="font-mono text-indigo-400 font-bold">
            {progressPercent}% Complete
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ACTIVE QUIZ VIEW or RESULTS VIEW */}
      {!isQuizFinished ? (
        currentQuestion && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Question Header & Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  Q{currentQuestionIndex + 1}
                </span>
                {getDifficultyBadge(currentQuestion.difficulty)}
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-medium">
                  {currentQuestion.topicReference}
                </span>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Select 1 of 4 options
              </span>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQuestion.question}
              </h4>
            </div>

            {/* 4 Multiple Choice Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedOption === optIdx || userAnswers[currentQuestion.id] === optIdx;
                const isAnswerSubmitted = hasSubmittedCurrent || userAnswers[currentQuestion.id] !== undefined;
                const isCorrectOption = currentQuestion.correctIndex === optIdx;

                let cardStyle = 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300';
                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    cardStyle = 'border-emerald-500 bg-emerald-950/30 text-emerald-200 font-medium ring-1 ring-emerald-500/50';
                  } else if (isSelected && !isCorrectOption) {
                    cardStyle = 'border-rose-500 bg-rose-950/30 text-rose-200 font-medium ring-1 ring-rose-500/50';
                  } else {
                    cardStyle = 'border-slate-800/40 bg-slate-950/20 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  cardStyle = 'border-indigo-500 bg-indigo-950/40 text-indigo-100 ring-2 ring-indigo-500/40';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>

                    {isAnswerSubmitted && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 ml-2" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box (Shown after submit) */}
            {(hasSubmittedCurrent || userAnswers[currentQuestion.id] !== undefined) && (
              <div
                className={`rounded-2xl border p-4.5 text-xs leading-relaxed transition-all ${
                  (selectedOption === currentQuestion.correctIndex || userAnswers[currentQuestion.id] === currentQuestion.correctIndex)
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
                  {(selectedOption === currentQuestion.correctIndex || userAnswers[currentQuestion.id] === currentQuestion.correctIndex) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-rose-400" />
                      <span>Incorrect — Option {String.fromCharCode(65 + currentQuestion.correctIndex)} is correct</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Navigation & Submit Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex((prev) => prev - 1);
                    setSelectedOption(userAnswers[questions[currentQuestionIndex - 1]?.id] ?? null);
                    setHasSubmittedCurrent(userAnswers[questions[currentQuestionIndex - 1]?.id] !== undefined);
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              {!(hasSubmittedCurrent || userAnswers[currentQuestion.id] !== undefined) ? (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all"
                >
                  <span>
                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'View Final Score'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        /* QUIZ COMPLETED FINAL SCORE SCREEN */
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-xl text-white">
              <Award className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Exam Simulation Complete
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-white mt-2">
                {scorePercent}% Score
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You correctly answered {correctCount} out of {totalQuestions} questions.
              </p>
            </div>

            {/* Performance Verdict Pill */}
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-2 text-xs">
              <span className="text-slate-400">Readiness Status:</span>
              <span
                className={`font-bold ${
                  scorePercent >= 80
                    ? 'text-emerald-400'
                    : scorePercent >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {scorePercent >= 80
                  ? 'A Grade • High Exam Mastery'
                  : scorePercent >= 60
                  ? 'B/C Grade • Review Tricky Pitfalls'
                  : 'Needs Immediate Review'}
              </span>
            </div>

            {/* Breakdown by Difficulty Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
              {(['Easy', 'Medium', 'Hard'] as QuestionDifficulty[]).map((d) => {
                const stat = difficultyStats[d];
                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                return (
                  <div key={d} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {getDifficultyBadge(d)}
                      <span className="text-xs font-bold text-white font-mono">{pct}%</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {stat.correct} / {stat.total} Correct
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4 text-slate-400" />
                <span>Retake Quiz</span>
              </button>

              {onGoToWeakness && (
                <button
                  onClick={onGoToWeakness}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Analyze Weak Topics</span>
                </button>
              )}

              {onGenerateCustomQuiz && (
                <button
                  onClick={() => setShowGeneratorModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate New AI Quiz</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  Comprehensive Question Audit
                </h4>
              </div>

              <div className="flex rounded-lg border border-slate-800 bg-slate-950/80 p-0.5 text-xs">
                <button
                  onClick={() => setReviewFilterMissedOnly(false)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    !reviewFilterMissedOnly
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setReviewFilterMissedOnly(true)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    reviewFilterMissedOnly
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Missed Only ({missedQuestions.length})
                </button>
              </div>
            </div>

            {/* Questions Review Accordion/Cards */}
            <div className="space-y-3.5">
              {(reviewFilterMissedOnly ? missedQuestions : questions).map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4.5 space-y-3 transition-all ${
                      isCorrect
                        ? 'border-emerald-500/20 bg-slate-950/60'
                        : 'border-rose-500/30 bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <h5 className="text-xs sm:text-sm font-semibold text-white">
                          {q.question}
                        </h5>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getDifficultyBadge(q.difficulty)}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {q.topicReference}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          Your Answer:
                        </span>
                        <span className={isCorrect ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>
                          {userAns !== undefined ? `${String.fromCharCode(65 + userAns)}: ${q.options[userAns]}` : 'Not answered'}
                        </span>
                      </div>

                      <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-2.5">
                        <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-0.5">
                          Correct Answer:
                        </span>
                        <span className="text-emerald-200 font-medium">
                          {String.fromCharCode(65 + q.correctIndex)}: {q.options[q.correctIndex]}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                      <strong className="text-slate-400">Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GENERATE CUSTOM QUIZ MODAL */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Generate AI Custom Quiz</h3>
              </div>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Number of Questions:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 8, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setGenCount(cnt)}
                      className={`rounded-xl border p-2 font-mono font-bold transition-all ${
                        genCount === cnt
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Difficulty Level:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setGenDifficulty(diff)}
                      className={`rounded-xl border p-2 font-bold transition-all ${
                        genDifficulty === diff
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSubmit}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90"
              >
                Generate Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
