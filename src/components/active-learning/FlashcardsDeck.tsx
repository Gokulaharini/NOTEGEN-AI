import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { FlashcardItem } from '../../types';
import { speechManager } from '../../utils/speech';

interface FlashcardsDeckProps {
  flashcards: FlashcardItem[];
  masteredFlashcards: Set<string>;
  onToggleMaster: (cardId: string) => void;
  onMarkKnown?: (cardId: string) => void;
  onMarkNeedRevision?: (cardId: string) => void;
  onResetMastery: () => void;
  onGenerateFlashcards?: () => Promise<void>;
  isGenerating?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const FlashcardsDeck: React.FC<FlashcardsDeckProps> = ({
  flashcards,
  masteredFlashcards,
  onToggleMaster,
  onMarkKnown,
  onMarkNeedRevision,
  onResetMastery,
  onGenerateFlashcards,
  isGenerating = false,
  errorMessage = null,
  onClearError,
}) => {
  const [deck, setDeck] = useState<FlashcardItem[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync deck when props change
  useEffect(() => {
    setDeck(flashcards);
    // If current index is out of bounds with new deck, clamp to 0
    if (currentIndex >= flashcards.length) {
      setCurrentIndex(0);
    }
  }, [flashcards]);

  useEffect(() => {
    speechManager.setOnStateChange((speaking) => setIsSpeaking(speaking));
    return () => {
      speechManager.stop();
    };
  }, []);

  // Filter deck based on status
  const activeCards = deck.filter((c) => {
    if (filterMode === 'unmastered') return !masteredFlashcards.has(c.id);
    if (filterMode === 'mastered') return masteredFlashcards.has(c.id);
    return true;
  });

  const totalCount = activeCards.length;
  // Ensure currentIndex stays within bounds of filtered deck
  const safeIndex = totalCount > 0 ? Math.min(currentIndex, totalCount - 1) : 0;
  const currentCard: FlashcardItem | undefined = activeCards[safeIndex];

  const masteredCount = deck.filter((c) => masteredFlashcards.has(c.id)).length;
  const masteryPercentage = deck.length > 0 ? Math.round((masteredCount / deck.length) * 100) : 0;

  // Keyboard navigation: Left/Right arrow to navigate, Space to flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, totalCount]);

  const handleNext = () => {
    speechManager.stop();
    setIsFlipped(false);
    if (totalCount > 0) {
      setCurrentIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
    }
  };

  const handlePrev = () => {
    speechManager.stop();
    setIsFlipped(false);
    if (totalCount > 0) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
    }
  };

  const handleShuffle = () => {
    speechManager.stop();
    setIsFlipped(false);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
  };

  const handleIKnow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentCard) return;
    if (onMarkKnown) {
      onMarkKnown(currentCard.id);
    } else {
      onToggleMaster(currentCard.id);
    }
    handleNext();
  };

  const handleNeedRevision = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentCard) return;
    if (onMarkNeedRevision) {
      onMarkNeedRevision(currentCard.id);
    } else if (masteredFlashcards.has(currentCard.id)) {
      onToggleMaster(currentCard.id);
    }
    handleNext();
  };

  const handleSpeakCurrentCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;

    if (isSpeaking) {
      speechManager.stop();
    } else {
      const textToSpeak = isFlipped
        ? `Answer: ${currentCard.back}. ${currentCard.examTip ? `Exam tip: ${currentCard.examTip}` : ''}`
        : `Topic: ${currentCard.topic}. Question: ${currentCard.front}`;
      speechManager.speak(textToSpeak);
    }
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Easy':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
      case 'Hard':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      case 'Medium':
      default:
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {onGenerateFlashcards && (
              <button
                onClick={() => onGenerateFlashcards()}
                disabled={isGenerating}
                className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Retry
              </button>
            )}
            {onClearError && (
              <button
                onClick={onClearError}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300 hover:text-white"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Flashcards Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Active Recall Flashcards</h3>
              <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono">
                {deck.length} Cards
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Flip to test key mechanisms, formulas, and recall memory hooks
            </p>
          </div>
        </div>

        {/* Action buttons: Generate Flashcards, Shuffle, Reset */}
        <div className="flex items-center gap-2">
          {onGenerateFlashcards && (
            <button
              onClick={() => onGenerateFlashcards()}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Generate fresh flashcards from your study material using Gemini"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Generating Cards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                  <span>Generate Flashcards</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleShuffle}
            disabled={deck.length <= 1}
            title="Shuffle Flashcard Deck"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <Shuffle className="h-3.5 w-3.5 text-slate-400" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={onResetMastery}
            disabled={masteredCount === 0}
            title="Reset Mastered Cards"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Progress & Filters Strip */}
      {deck.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
          {/* Progress Bar & Counter */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white">{masteredCount}</span>
              <span>of {deck.length} Mastered</span>
              <span className="font-mono text-emerald-400 font-bold">({masteryPercentage}%)</span>
            </div>

            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => { setFilterMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({deck.length})
            </button>
            <button
              onClick={() => { setFilterMode('unmastered'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                filterMode === 'unmastered'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Needs Review ({deck.length - masteredCount})
            </button>
            <button
              onClick={() => { setFilterMode('mastered'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                filterMode === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mastered ({masteredCount})
            </button>
          </div>
        </div>
      )}

      {/* Main Flashcard 3D Stage */}
      {currentCard ? (
        <div className="mx-auto max-w-2xl">
          {/* Card Meta Indicator */}
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-indigo-400 text-sm">
                Card {safeIndex + 1} of {totalCount}
              </span>
              <span>•</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                {currentCard.topic}
              </span>
              {currentCard.difficulty && (
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${getDifficultyColor(currentCard.difficulty)}`}>
                  {currentCard.difficulty}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeakCurrentCard}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isSpeaking ? 'Stop Audio' : 'Listen to card'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-3 w-3 text-indigo-400 animate-pulse" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3 text-slate-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Space to flip, &larr;/&rarr; to navigate
              </span>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 min-h-[320px] sm:min-h-[350px] cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            aria-label={`Flashcard: ${isFlipped ? 'Answer side' : 'Question side'}. Click to flip.`}
          >
            <div
              className={`transform-style-3d relative h-full w-full rounded-3xl border transition-all duration-500 shadow-2xl ${
                isFlipped
                  ? 'border-indigo-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 ring-1 ring-indigo-500/30'
                  : 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 hover:border-slate-700'
              } p-7 sm:p-9 flex flex-col justify-between`}
            >
              {/* FRONT VIEW (Question / Prompt) */}
              <div className={`flex h-full flex-col justify-between ${isFlipped ? 'hidden' : 'flex'}`}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Question / Front
                    </span>
                    {masteredFlashcards.has(currentCard.id) && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mastered</span>
                      </span>
                    )}
                  </div>

                  <div className="my-8 text-center px-2">
                    <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed tracking-tight">
                      {currentCard.front}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors">
                  <RotateCw className="h-4 w-4" />
                  <span>Click card to reveal Answer</span>
                </div>
              </div>

              {/* BACK VIEW (Answer / Solution) */}
              <div className={`flex h-full flex-col justify-between ${!isFlipped ? 'hidden' : 'flex'}`}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Answer / Back
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Topic: {currentCard.topic}
                    </span>
                  </div>

                  <div className="my-4">
                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
                      {currentCard.back}
                    </p>

                    {currentCard.examTip && (
                      <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          <span>Exam Trick / Memory Hook:</span>
                        </div>
                        <p className="text-amber-200/90 leading-relaxed">
                          {currentCard.examTip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Click card to flip back to question</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard Action Buttons */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              title="Previous card (Left Arrow)"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* I Know ✓ and Need Revision ✕ buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleNeedRevision}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 sm:px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Mark for revision and advance to next card"
              >
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Need Revision ✕</span>
              </button>

              <button
                onClick={handleIKnow}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 sm:px-5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Mark as known/mastered and advance to next card"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>I Know ✓</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              title="Next card (Right Arrow)"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center max-w-xl mx-auto">
          {filterMode !== 'all' && deck.length > 0 ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
              <h4 className="text-base font-bold text-white">No cards in this view</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {filterMode === 'unmastered'
                  ? 'Congratulations! You have marked every flashcard in this deck as mastered.'
                  : 'You haven’t marked any cards with "I Know ✓" yet.'}
              </p>
              <button
                onClick={() => setFilterMode('all')}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Show All Flashcards
              </button>
            </>
          ) : (
            <>
              <Layers className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
              <h4 className="text-lg font-bold text-white">No Flashcards Available</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Click below to generate 5–10 active recall flashcards from your study material using Gemini AI.
              </p>
              {onGenerateFlashcards && (
                <button
                  onClick={() => onGenerateFlashcards()}
                  disabled={isGenerating}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
                  <span>{isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards'}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
