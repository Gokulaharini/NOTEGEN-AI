import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Target, 
  HelpCircle, 
  Activity, 
  Zap, 
  Volume2, 
  VolumeX, 
  Clock, 
  BookMarked,
  Layers,
  ChevronRight,
  Compass,
  Flame
} from 'lucide-react';
import { AnalysisResult, ExplanationLevel } from '../types';
import { speechManager } from '../utils/speech';

export type WorkflowTab = 'notes' | 'intelligence' | 'practice' | 'weakness' | 'emergency' | 'cram';

interface WorkflowNavProps {
  result: AnalysisResult;
  activeTab: WorkflowTab;
  onTabChange: (tab: WorkflowTab) => void;
  explanationLevel: ExplanationLevel;
  onLevelChange: (newLevel: ExplanationLevel) => void;
  isRegeneratingLevel?: boolean;
}

export const WorkflowNav: React.FC<WorkflowNavProps> = ({
  result,
  activeTab,
  onTabChange,
  explanationLevel,
  onLevelChange,
  isRegeneratingLevel = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    speechManager.setOnStateChange((speaking) => setIsSpeaking(speaking));
    return () => {
      speechManager.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    if (isSpeaking) {
      speechManager.stop();
    } else {
      // Build speech text of summary and key revision points
      let text = `Summary for ${result.metadata.title}. ${result.summary.quickSummary}. Key Takeaway: ${result.summary.keyTakeaway}. Here are the top exam revision points. `;
      result.examRevisionPoints.slice(0, 5).forEach((p, i) => {
        text += `Point ${i + 1}: ${p.point}. `;
      });
      speechManager.speak(text);
    }
  };

  const tabs: Array<{ id: WorkflowTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; isSpecial?: boolean }> = [
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'intelligence', label: 'Exam Intelligence', icon: Compass },
    { id: 'practice', label: 'Practice Arena', icon: HelpCircle, badge: `${result.practiceQuiz.length}Q` },
    { id: 'weakness', label: 'Weak Topic Analyzer', icon: Activity },
    { id: 'emergency', label: 'I Have Only 30 Mins', icon: Flame, isSpecial: true },
    { id: 'cram', label: '5-Min Cram Sheet', icon: Zap },
  ];

  return (
    <div className="no-print border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-[61px] z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookMarked className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                {result.metadata.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-300 font-medium">{result.metadata.subject}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {result.metadata.estimatedStudyTime}
                </span>
                <span>•</span>
                <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-300">
                  {result.metadata.difficultyLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Level Switcher & Audio Read-Aloud */}
          <div className="flex items-center gap-2.5">
            {/* Audio Read-Aloud Button */}
            <button
              onClick={handleToggleAudio}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isSpeaking
                  ? 'border-indigo-500 bg-indigo-600 text-white animate-pulse'
                  : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
              title="Listen to audio overview"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Explanation Level Selector */}
            <div 
              role="radiogroup" 
              aria-label="Explanation Level" 
              className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 gap-1"
            >
              <span className="px-2 text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Level:
              </span>
              {(['beginner', 'standard', 'exam-ready'] as ExplanationLevel[]).map((lvl) => {
                const isActive = explanationLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={0}
                    disabled={isRegeneratingLevel}
                    onClick={() => {
                      if (!isActive) onLevelChange(lvl);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
                      isActive
                        ? lvl === 'beginner'
                          ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/80'
                          : lvl === 'exam-ready'
                          ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/80'
                          : 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    } disabled:opacity-50`}
                  >
                    {lvl === 'exam-ready' ? 'Exam Ready' : lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Workflow Tabs Row */}
        <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isSpecial) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-tight whitespace-nowrap transition-all border ${
                    isActive
                      ? 'border-rose-500 bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/50'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-700/60 text-indigo-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
