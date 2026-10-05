import React, { useState } from 'react';
import { 
  HelpCircle, 
  Layers, 
  Sparkles, 
  BookOpen, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AnalysisResult, QuizQuestion, FlashcardItem, UploadedFileItem } from '../types';
import { FlashcardsDeck } from './active-learning/FlashcardsDeck';
import { QuizEngine } from './active-learning/QuizEngine';

interface PracticeArenaProps {
  result: AnalysisResult;
  userQuizAnswers: Record<string, number>;
  onQuizAnswer: (questionId: string, optionIndex: number) => void;
  masteredFlashcards: Set<string>;
  onToggleMasterFlashcard: (cardId: string) => void;
  onMarkFlashcardKnown?: (cardId: string) => void;
  onMarkFlashcardNeedRevision?: (cardId: string) => void;
  onResetMastery: () => void;
  onResetQuiz: () => void;
  onGoToWeakness: () => void;
  onUpdateQuizQuestions?: (newQuestions: QuizQuestion[]) => void;
  onUpdateFlashcards?: (newCards: FlashcardItem[]) => void;
  studyContext?: string;
  fileData?: string;
  mimeType?: string;
  files?: UploadedFileItem[];
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  result,
  userQuizAnswers,
  onQuizAnswer,
  masteredFlashcards,
  onToggleMasterFlashcard,
  onMarkFlashcardKnown,
  onMarkFlashcardNeedRevision,
  onResetMastery,
  onResetQuiz,
  onGoToWeakness,
  onUpdateQuizQuestions,
  onUpdateFlashcards,
  studyContext,
  fileData,
  mimeType,
  files,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'flashcards'>('quiz');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  const { practiceQuiz, flashcards } = result;

  // Custom Quiz Generation using /api/generate-quiz
  const handleGenerateCustomQuiz = async (count: number, difficulty: string) => {
    if (!onUpdateQuizQuestions) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyContext: studyContext || result.summary.quickSummary,
          count,
          difficulty,
          fileData,
          mimeType,
          files,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate new quiz questions');
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        onUpdateQuizQuestions(data.questions);
      }
    } catch (err) {
      console.error('[NoteGen AI] Generate custom quiz error:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Dedicated Flashcards Generation using /api/generate-flashcards
  const handleGenerateFlashcards = async () => {
    if (!onUpdateFlashcards) return;
    setIsGeneratingFlashcards(true);
    setFlashcardError(null);
    try {
      // Build rich context from currently uploaded material
      let contextToSend = studyContext;
      if (!contextToSend || contextToSend.trim().length < 50) {
        contextToSend = [
          `Title: ${result.metadata.title}`,
          `Subject: ${result.metadata.subject}`,
          `Summary: ${result.summary.quickSummary}`,
          `Core Premise: ${result.summary.corePremise}`,
          `Key Points:\n${result.keyPoints.map((kp) => `- ${kp.point}`).join('\n')}`,
          `Topic Notes:\n${result.topicNotes.map((tn) => `Topic: ${tn.topicTitle}\n${tn.simpleExplanation}`).join('\n\n')}`,
          `Definitions:\n${result.definitions.map((d) => `- ${d.term}: ${d.explanation}`).join('\n')}`,
          result.hasFormulas ? `Formulas:\n${result.formulas.map((f) => `- ${f.name}: ${f.formula}`).join('\n')}` : '',
        ].filter(Boolean).join('\n\n');
      }

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyContext: contextToSend,
          count: 8, // 5–10 flashcards
          fileData,
          mimeType,
          files,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate flashcards from Gemini API.');
      }

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        onUpdateFlashcards(data.flashcards);
      } else {
        throw new Error('Gemini API did not return any flashcards. Please retry.');
      }
    } catch (err: any) {
      console.error('[NoteGen AI] Generate flashcards error:', err);
      setFlashcardError(err?.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const answeredQuizCount = Object.keys(userQuizAnswers).length;
  const isQuizComplete = answeredQuizCount === practiceQuiz.length && practiceQuiz.length > 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Phase 2: Active Learning Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Practice Arena & Active Recall
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transform passive study notes into dynamic retrieval practice and flashcard mastery
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-lg">
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeSubTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>AI Practice Quiz</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeSubTab === 'quiz'
                  ? 'bg-indigo-700/80 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {practiceQuiz.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeSubTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Interactive Flashcards</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeSubTab === 'flashcards'
                  ? 'bg-indigo-700/80 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {masteredFlashcards.size}/{flashcards.length}
            </span>
          </button>
        </div>
      </div>

      {/* Active Sub-tab View */}
      {activeSubTab === 'quiz' && (
        <QuizEngine
          questions={practiceQuiz}
          userAnswers={userQuizAnswers}
          onAnswer={onQuizAnswer}
          onResetQuiz={onResetQuiz}
          onGoToWeakness={onGoToWeakness}
          onGenerateCustomQuiz={handleGenerateCustomQuiz}
          isGenerating={isGeneratingQuiz}
        />
      )}

      {activeSubTab === 'flashcards' && (
        <FlashcardsDeck
          flashcards={flashcards}
          masteredFlashcards={masteredFlashcards}
          onToggleMaster={onToggleMasterFlashcard}
          onMarkKnown={onMarkFlashcardKnown}
          onMarkNeedRevision={onMarkFlashcardNeedRevision}
          onResetMastery={onResetMastery}
          onGenerateFlashcards={handleGenerateFlashcards}
          isGenerating={isGeneratingFlashcards}
          errorMessage={flashcardError}
          onClearError={() => setFlashcardError(null)}
        />
      )}

      {/* Weakness Analysis Prompt Bar */}
      {isQuizComplete && activeSubTab === 'quiz' && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Practice Quiz Completed!
              </h4>
              <p className="text-xs text-emerald-200/80">
                Your diagnostic exam readiness score and high-risk vulnerability analysis are ready.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToWeakness}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
          >
            <span>View Weakness Diagnosis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
