import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { WorkflowNav, WorkflowTab } from './components/WorkflowNav';
import { SmartNotesView } from './components/SmartNotesView';
import { PracticeArena } from './components/PracticeArena';
import { WeaknessView } from './components/WeaknessView';
import { CramSheetView } from './components/CramSheetView';
import { ExamIntelligenceView } from './components/intelligence/ExamIntelligenceView';
import { EmergencyRevisionView } from './components/emergency/EmergencyRevisionView';
import { AskNotesAssistant } from './components/assistant/AskNotesAssistant';
import { DeepDiveModal } from './components/DeepDiveModal';
import { AnalysisResult, ExplanationLevel, QuizQuestion, FlashcardItem, UploadedFileItem } from './types';

interface StoredPayload {
  fileData?: string;
  files?: UploadedFileItem[];
  mimeType?: string;
  fileName?: string;
  fileSizeFormatted?: string;
  textContent?: string;
  sourceType: 'pdf' | 'text' | 'sample';
}

const STORAGE_KEY_RESULT = 'notegen_ai_result';
const STORAGE_KEY_QUIZ = 'notegen_ai_quiz';
const STORAGE_KEY_FLASHCARDS = 'notegen_ai_flashcards';
const STORAGE_KEY_PAYLOAD = 'notegen_ai_payload';
const STORAGE_KEY_LEVEL = 'notegen_ai_level';

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('standard');
  const [activeTab, setActiveTab] = useState<WorkflowTab>('notes');
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, number>>({});
  const [masteredFlashcards, setMasteredFlashcards] = useState<Set<string>>(new Set());
  const [lastPayload, setLastPayload] = useState<StoredPayload | null>(null);
  const [deepDiveState, setDeepDiveState] = useState<{ topic: string; context?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialQuestion, setAssistantInitialQuestion] = useState<string | undefined>(undefined);

  const handleTriggerAssistant = (question?: string) => {
    setAssistantInitialQuestion(question);
    setIsAssistantOpen(true);
  };

  // Restore state from localStorage on first load
  useEffect(() => {
    try {
      const savedResultStr = localStorage.getItem(STORAGE_KEY_RESULT);
      let parsedResult: AnalysisResult | null = null;
      if (savedResultStr) {
        parsedResult = JSON.parse(savedResultStr);
        setResult(parsedResult);
      }

      const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);
      if (savedLevel === 'beginner' || savedLevel === 'standard' || savedLevel === 'exam-ready') {
        setExplanationLevel(savedLevel as ExplanationLevel);
      } else if (parsedResult?.explanationLevel) {
        setExplanationLevel(parsedResult.explanationLevel);
      }

      const savedQuiz = localStorage.getItem(STORAGE_KEY_QUIZ);
      if (savedQuiz) {
        setUserQuizAnswers(JSON.parse(savedQuiz));
      }

      const savedFlashcards = localStorage.getItem(STORAGE_KEY_FLASHCARDS);
      if (savedFlashcards) {
        setMasteredFlashcards(new Set(JSON.parse(savedFlashcards)));
      }

      const savedPayload = localStorage.getItem(STORAGE_KEY_PAYLOAD);
      if (savedPayload) {
        setLastPayload(JSON.parse(savedPayload));
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEVEL, explanationLevel);
    } catch {
      // Fallback
    }
  }, [explanationLevel]);

  useEffect(() => {
    try {
      if (result) {
        localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
      } else {
        localStorage.removeItem(STORAGE_KEY_RESULT);
      }
    } catch {
      // Fallback
    }
  }, [result]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(userQuizAnswers));
    } catch {
      // Fallback
    }
  }, [userQuizAnswers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_FLASHCARDS,
        JSON.stringify(Array.from(masteredFlashcards))
      );
    } catch {
      // Fallback
    }
  }, [masteredFlashcards]);

  const handleAnalyze = async (payload: {
    fileData?: string;
    files?: UploadedFileItem[];
    mimeType?: string;
    fileName?: string;
    fileSizeFormatted?: string;
    textContent?: string;
    level: ExplanationLevel;
    sourceType: 'pdf' | 'text' | 'sample';
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setExplanationLevel(payload.level);

    const storedPayload: StoredPayload = {
      fileData: payload.fileData,
      files: payload.files,
      mimeType: payload.mimeType,
      fileName: payload.fileName,
      fileSizeFormatted: payload.fileSizeFormatted,
      textContent: payload.textContent,
      sourceType: payload.sourceType,
    };
    setLastPayload(storedPayload);
    try {
      // Exclude large base64 data before saving to localStorage to prevent quota overflow
      const safePayload = {
        ...storedPayload,
        fileData: undefined,
        files: storedPayload.files?.map((f) => ({ ...f, data: '' })),
      };
      localStorage.setItem(STORAGE_KEY_PAYLOAD, JSON.stringify(safePayload));
    } catch {
      // Fallback
    }

    try {
      const response = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error occurred during note generation.');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setUserQuizAnswers({});
      setMasteredFlashcards(new Set());
      setActiveTab('notes');
    } catch (err: any) {
      console.error('[NoteGen AI] Upload error:', err);
      setErrorMessage(err?.message || 'Failed to process study material. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelChange = (newLevel: ExplanationLevel) => {
    // 1. Immediately update the shared state so UI reflects the selection instantly (0ms delay)
    setExplanationLevel(newLevel);
    // Optimistically update result object as well
    setResult((prev) => (prev ? { ...prev, explanationLevel: newLevel } : null));

    // 2. Dispatch API regeneration with the selected level
    if (lastPayload) {
      handleAnalyze({
        ...lastPayload,
        level: newLevel,
      });
    }
  };

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    setUserQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleMasterFlashcard = (cardId: string) => {
    setMasteredFlashcards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleMarkFlashcardKnown = (cardId: string) => {
    setMasteredFlashcards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  };

  const handleMarkFlashcardNeedRevision = (cardId: string) => {
    setMasteredFlashcards((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const handleReset = () => {
    setResult(null);
    setLastPayload(null);
    setUserQuizAnswers({});
    setMasteredFlashcards(new Set());
    setActiveTab('notes');
    setErrorMessage(null);
    try {
      localStorage.removeItem(STORAGE_KEY_RESULT);
      localStorage.removeItem(STORAGE_KEY_QUIZ);
      localStorage.removeItem(STORAGE_KEY_FLASHCARDS);
      localStorage.removeItem(STORAGE_KEY_PAYLOAD);
    } catch {
      // Fallback
    }
  };

  const handleResetQuiz = () => {
    setUserQuizAnswers({});
  };

  const handleResetMastery = () => {
    setMasteredFlashcards(new Set());
  };

  const handleUpdateQuizQuestions = (newQuestions: QuizQuestion[]) => {
    setResult((prev) => (prev ? { ...prev, practiceQuiz: newQuestions } : null));
    setUserQuizAnswers({});
  };

  const handleUpdateFlashcards = (newCards: FlashcardItem[]) => {
    setResult((prev) => (prev ? { ...prev, flashcards: newCards } : null));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Header result={result} onReset={handleReset} activeTab={activeTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If no result yet, show Upload & Sample Picker */}
        {!result && (
          <div className="py-6 sm:py-10">
            {errorMessage && (
              <div className="mx-auto max-w-4xl px-4 sm:px-6 mb-6">
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300">
                  <p className="font-bold mb-0.5">Generation Failed:</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}
            <UploadSection
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              explanationLevel={explanationLevel}
              onExplanationLevelChange={setExplanationLevel}
            />
          </div>
        )}

        {/* If result is ready, show full Workflow */}
        {result && (
          <div>
            {/* Step & Strategy Navigation Bar */}
            <WorkflowNav
              result={result}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              explanationLevel={explanationLevel}
              onLevelChange={handleLevelChange}
              isRegeneratingLevel={isLoading}
            />

            {/* Tab View Container */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
              {activeTab === 'notes' && (
                <SmartNotesView
                  result={result}
                  onDeepDive={(topic, context) =>
                    setDeepDiveState({ topic, context })
                  }
                  onAskQuestion={handleTriggerAssistant}
                />
              )}

              {activeTab === 'intelligence' && (
                <ExamIntelligenceView
                  result={result}
                  userQuizAnswers={userQuizAnswers}
                  onGoToPractice={() => setActiveTab('practice')}
                  onGoToEmergency={() => setActiveTab('emergency')}
                  studyContext={lastPayload?.textContent || result.summary.quickSummary}
                  fileData={lastPayload?.fileData}
                  mimeType={lastPayload?.mimeType}
                />
              )}

              {activeTab === 'emergency' && (
                <EmergencyRevisionView
                  result={result}
                  userQuizAnswers={userQuizAnswers}
                  onGoToFlashcards={() => setActiveTab('practice')}
                  onGoToQuiz={() => setActiveTab('practice')}
                  studyContext={lastPayload?.textContent || result.summary.quickSummary}
                />
              )}

              {activeTab === 'practice' && (
                <PracticeArena
                  result={result}
                  userQuizAnswers={userQuizAnswers}
                  onQuizAnswer={handleQuizAnswer}
                  masteredFlashcards={masteredFlashcards}
                  onToggleMasterFlashcard={handleToggleMasterFlashcard}
                  onMarkFlashcardKnown={handleMarkFlashcardKnown}
                  onMarkFlashcardNeedRevision={handleMarkFlashcardNeedRevision}
                  onResetMastery={handleResetMastery}
                  onResetQuiz={handleResetQuiz}
                  onGoToWeakness={() => setActiveTab('weakness')}
                  onUpdateQuizQuestions={handleUpdateQuizQuestions}
                  onUpdateFlashcards={handleUpdateFlashcards}
                  studyContext={lastPayload?.textContent || result.summary.quickSummary}
                  fileData={lastPayload?.fileData}
                  mimeType={lastPayload?.mimeType}
                  files={lastPayload?.files}
                />
              )}

              {activeTab === 'weakness' && (
                <WeaknessView
                  result={result}
                  userQuizAnswers={userQuizAnswers}
                  masteredFlashcards={masteredFlashcards}
                  onGoToPractice={() => setActiveTab('practice')}
                  onGoToCramSheet={() => setActiveTab('cram')}
                  onResetQuiz={handleResetQuiz}
                  studyContext={lastPayload?.textContent || result.summary.quickSummary}
                  fileData={lastPayload?.fileData}
                  mimeType={lastPayload?.mimeType}
                />
              )}

              {activeTab === 'cram' && (
                <CramSheetView result={result} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Animated Loading Overlay */}
      {isLoading && (
        <ProcessingOverlay
          level={explanationLevel}
          fileName={lastPayload?.fileName || 'Study Document'}
        />
      )}

      {/* Deep Dive Modal */}
      {deepDiveState && (
        <DeepDiveModal
          topic={deepDiveState.topic}
          context={deepDiveState.context}
          level={explanationLevel}
          onClose={() => setDeepDiveState(null)}
        />
      )}

      {/* Ask Your Notes Grounded Assistant Drawer */}
      {result && (
        <AskNotesAssistant
          result={result}
          studyContext={lastPayload?.textContent || result.summary.quickSummary}
          fileData={lastPayload?.fileData}
          mimeType={lastPayload?.mimeType}
          isOpen={isAssistantOpen}
          onToggleOpen={() => setIsAssistantOpen(!isAssistantOpen)}
          initialQuestion={assistantInitialQuestion}
        />
      )}
    </div>
  );
}
