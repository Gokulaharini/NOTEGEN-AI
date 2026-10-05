import React, { useEffect, useState } from 'react';
import { X, Sparkles, Brain, Loader2, BookOpen } from 'lucide-react';
import { ExplanationLevel } from '../types';

interface DeepDiveModalProps {
  topic: string;
  context?: string;
  level: ExplanationLevel;
  onClose: () => void;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ topic, context, level, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDeepDive = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/explain-deep-dive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, context, level }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch deep dive explanation');
        }

        const data = await res.json();
        if (isMounted) {
          setContent(data.explanation || 'No content generated.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error generating explanation.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDeepDive();

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
  }, [topic, context, level, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4.5 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                Exam Deep Dive
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {topic}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-200 leading-relaxed">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">
                Synthesizing targeted mental models, tricky exam questions, and mnemonics...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="prose prose-invert prose-xs max-w-none space-y-3 font-sans whitespace-pre-line text-slate-300">
              {content}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
