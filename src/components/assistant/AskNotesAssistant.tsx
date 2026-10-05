import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  BookOpen, 
  Loader2, 
  RotateCcw, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AnalysisResult } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isNotFoundWarning?: boolean;
}

interface AskNotesAssistantProps {
  result: AnalysisResult;
  studyContext?: string;
  fileData?: string;
  mimeType?: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  initialQuestion?: string;
}

const QUICK_PROMPTS = [
  "Explain this in simple terms.",
  "What are the important concepts?",
  "Give me an example.",
  "Quiz me on this chapter.",
  "What should I revise first?"
];

export const AskNotesAssistant: React.FC<AskNotesAssistantProps> = ({
  result,
  studyContext,
  fileData,
  mimeType,
  isOpen,
  onToggleOpen,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I am your **NoteGen Grounded Assistant** for *"${result.metadata.title}"*.\n\nI answer your questions strictly using your uploaded study material as the primary source. If a concept is not mentioned in your notes, I will let you know to keep your exam preparation safe and focused.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle auto-firing initial question if triggered externally
  useEffect(() => {
    if (initialQuestion && isOpen) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSendMessage = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/ask-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          studyContext: studyContext || result.summary.quickSummary,
          fileData,
          mimeType,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer from study notes.');
      }

      const data = await res.json();
      const answerText: string = data.answer || '';
      const isNotFound = answerText.includes('not found in your supplied study material') || answerText.includes('not found in your uploaded');

      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: answerText,
        timestamp: data.timestamp || Date.now(),
        isNotFoundWarning: isNotFound,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Sorry, I encountered an issue consulting your study notes. Please try asking again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Conversation cleared. Ask any question about *"${result.metadata.title}"* and I will answer grounded in your notes.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <>
      {/* FLOATING ACTION PILL (Visible when drawer is closed) */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          aria-label="Open Ask Your Notes Assistant"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-indigo-500/50 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group select-none no-print"
        >
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <span>Ask Your Notes</span>
          <span className="hidden sm:inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-200">
            Document Grounded
          </span>
        </button>
      )}

      {/* SLIDE-OUT DRAWER PANEL */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 z-50 flex flex-col border-t sm:border-l border-indigo-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300 no-print ${
            isExpanded
              ? 'h-full w-full sm:w-[620px]'
              : 'h-[580px] w-full sm:w-[440px] rounded-t-3xl sm:rounded-tl-3xl'
          }`}
        >
          {/* DRAWER HEADER */}
          <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">Ask Your Notes</h3>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 uppercase">
                    Grounded
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">
                  {result.metadata.title}
                </p>
              </div>
            </div>

            {/* Header controls: Expand/Minimize, Reset, Close */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="hidden sm:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={onToggleOpen}
                title="Close Drawer"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* GROUNDING NOTICE BAR */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-2 border-b border-slate-800/80 text-[10px] text-slate-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              Answers derived exclusively from your uploaded study material.
            </span>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : msg.isNotFoundWarning
                        ? 'bg-amber-950/30 border border-amber-500/40 text-amber-200 rounded-bl-none'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.isNotFoundWarning && (
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Source Grounding Notice</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed space-y-1.5">
                      {msg.text}
                    </div>
                  </div>

                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Searching uploaded material & formulating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ONE-CLICK QUICK PROMPT CHIPS */}
          <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap pl-1">
              Suggested:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-indigo-500/40 hover:text-white disabled:opacity-40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-slate-800 p-3 bg-slate-950"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask anything about your notes..."
                disabled={loading}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-2.5 pl-3.5 pr-11 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputQuestion.trim() || loading}
                aria-label="Send question"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
