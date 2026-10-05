import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  Layers, 
  Bookmark, 
  Calculator, 
  Search,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowRight,
  FileDown
} from 'lucide-react';
import { AnalysisResult, TopicNoteItem } from '../types';
import { exportResultToPdf } from '../utils/exportPdf';

interface SmartNotesViewProps {
  result: AnalysisResult;
  onDeepDive: (topic: string, context?: string) => void;
  onAskQuestion?: (question: string) => void;
}

export const SmartNotesView: React.FC<SmartNotesViewProps> = ({ result, onDeepDive, onAskQuestion }) => {
  const [definitionSearch, setDefinitionSearch] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    '0': true, // First topic expanded by default
  });

  const toggleTopic = (index: number) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    result.topicNotes.forEach((_, idx) => {
      allExpanded[idx] = true;
    });
    setExpandedTopics(allExpanded);
  };

  const collapseAll = () => {
    setExpandedTopics({});
  };

  // Filter definitions based on user query
  const filteredDefinitions = result.definitions.filter(
    (d) =>
      d.term.toLowerCase().includes(definitionSearch.toLowerCase()) ||
      d.explanation.toLowerCase().includes(definitionSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16 print-area">
      {/* Ask Your Notes Quick Launcher */}
      <section className="no-print rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Ask Your Notes (Document Grounded)
                </h3>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 uppercase">
                  Primary Source
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ask questions answered strictly using your uploaded study material
              </p>
            </div>
          </div>

          <button
            onClick={() => onAskQuestion && onAskQuestion('What should I revise first?')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <span>Open Assistant</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400">
            Suggested Prompts:
          </span>
          {[
            "Explain this in simple terms.",
            "What are the important concepts?",
            "Give me an example.",
            "Quiz me on this chapter.",
            "What should I revise first?"
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAskQuestion && onAskQuestion(prompt)}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION A: Quick Summary */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                A. Quick Summary
              </h3>
              <p className="text-xs text-slate-400">
                Concise synthesis of the entire document
              </p>
            </div>
          </div>

          <button
            onClick={() => exportResultToPdf(result, { mode: 'full', filename: 'NoteGen_AI_Notes.pdf' })}
            className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 hover:text-white transition-colors cursor-pointer"
            title="Download complete Smart Notes as formatted A4 PDF"
          >
            <FileDown className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export Notes as PDF</span>
          </button>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4.5 text-sm leading-relaxed text-slate-200">
          {result.summary.quickSummary}
        </div>

        {/* Takeaway & Premise */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Key Exam Takeaway
            </span>
            <p className="text-xs text-slate-300">
              {result.summary.keyTakeaway}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
              Core Theoretical Premise
            </span>
            <p className="text-xs text-slate-300">
              {result.summary.corePremise}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION B: Key Points */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              B. Key Points
            </h3>
            <p className="text-xs text-slate-400">
              Fundamental concepts distilled as high-impact takeaways
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {result.keyPoints.map((kp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 transition-colors hover:border-slate-700"
            >
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  kp.importance === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : kp.importance === 'Important'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-slate-200">
                  {kp.point}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      kp.importance === 'Critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : kp.importance === 'Important'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {kp.importance}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{kp.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION C: Topic-wise Notes */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                C. Topic-wise Notes
              </h3>
              <p className="text-xs text-slate-400">
                Detailed breakdowns with explanations, definitions, and source citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs no-print">
            <button
              onClick={expandAll}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={collapseAll}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          {result.topicNotes.map((topic, idx) => {
            const isExpanded = !!expandedTopics[idx];

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 transition-all hover:border-slate-700/80"
              >
                {/* Topic Header Accordion */}
                <div
                  onClick={() => toggleTopic(idx)}
                  className="flex cursor-pointer items-center justify-between p-4 bg-slate-900/40 select-none"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {topic.topicTitle}
                        </h4>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                            topic.examYield === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : topic.examYield === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {topic.examYield} Yield
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Ref: {topic.sourceReference}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeepDive(topic.topicTitle, topic.simpleExplanation);
                      }}
                      className="no-print hidden sm:inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Deep Dive</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Topic Expanded Body */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-4.5 space-y-4 text-xs">
                    {/* Explanation */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Explanation
                      </span>
                      <p className="leading-relaxed text-slate-200 text-sm">
                        {topic.simpleExplanation}
                      </p>
                    </div>

                    {/* Important Concepts */}
                    {topic.importantConcepts && topic.importantConcepts.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Important Concepts
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {topic.importantConcepts.map((concept, cIdx) => (
                            <li
                              key={cIdx}
                              className="flex items-start gap-2 rounded-lg bg-slate-900/60 p-2 text-slate-300"
                            >
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{concept}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Topic Definitions */}
                    {topic.definitions && topic.definitions.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Key Terms
                        </span>
                        <div className="space-y-1.5">
                          {topic.definitions.map((def, dIdx) => (
                            <div
                              key={dIdx}
                              className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5"
                            >
                              <span className="font-bold text-indigo-300">
                                {def.term}
                              </span>{' '}
                              <span className="text-slate-400">→</span>{' '}
                              <span className="text-slate-300">{def.explanation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples in Source */}
                    {topic.examples && topic.examples.length > 0 && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Source Examples
                        </span>
                        <ul className="space-y-1">
                          {topic.examples.map((ex, eIdx) => (
                            <li key={eIdx} className="text-slate-300 flex items-start gap-1.5">
                              <span className="text-slate-500 font-mono">›</span>
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Common Exam Mistake */}
                    {topic.commonMistake && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-300">
                            Examiner Trap Alert
                          </span>
                          <span className="text-xs text-amber-200/90 leading-relaxed">
                            {topic.commonMistake}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION D: Important Definitions */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                D. Important Definitions
              </h3>
              <p className="text-xs text-slate-400">
                Format: <span className="font-mono text-emerald-400">TERM → Simple explanation</span>
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative no-print">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={definitionSearch}
              onChange={(e) => setDefinitionSearch(e.target.value)}
              placeholder="Search definitions..."
              className="rounded-lg border border-slate-700 bg-slate-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filteredDefinitions.length > 0 ? (
            filteredDefinitions.map((def, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-400 text-xs">
                    {def.term}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">TERM →</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {def.explanation}
                </p>
                {def.contextOrUsage && (
                  <p className="mt-1.5 text-[11px] text-slate-400 italic">
                    Context: {def.contextOrUsage}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-xs text-slate-500">
              No definitions match &ldquo;{definitionSearch}&rdquo;.
            </div>
          )}
        </div>
      </section>

      {/* SECTION E: Important Formulas */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              E. Important Formulas
            </h3>
            <p className="text-xs text-slate-400">
              Authentic formulas derived strictly from the source material
            </p>
          </div>
        </div>

        {result.hasFormulas && result.formulas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.formulas.map((form, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-300 text-xs">
                    {form.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {form.sourceContext}
                  </span>
                </div>

                {/* Formula display block */}
                <div className="my-2.5 rounded-lg border border-amber-500/30 bg-slate-950/80 p-3 font-mono text-xs font-semibold text-amber-200">
                  {form.formula}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {form.explanation}
                </p>

                {form.variables && form.variables.length > 0 && (
                  <div className="mt-3 border-t border-slate-800/80 pt-2 text-[11px]">
                    <span className="font-semibold text-slate-400 block mb-1">
                      Variables:
                    </span>
                    <ul className="space-y-0.5 text-slate-300 font-mono">
                      {form.variables.map((v, vIdx) => (
                        <li key={vIdx} className="flex items-center gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-center">
            <p className="text-xs text-slate-400">
              {result.formulasNote || 'No mathematical formulas found in this source material.'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              NoteGen AI never hallucinates or fabricates mathematical expressions.
            </p>
          </div>
        )}
      </section>

      {/* SECTION F: Exam Revision Points */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm print-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                F. Exam Revision Points
              </h3>
              <p className="text-xs text-slate-400">
                High-yield revision points useful for rapid review before your exam
              </p>
            </div>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {result.examRevisionPoints.length} Points
          </span>
        </div>

        {/* Disclaimer as required by prompt */}
        <div className="mb-4 rounded-lg bg-slate-950/80 border border-slate-800 p-2.5 text-[11px] text-slate-400 italic">
          Disclaimer: These are concise high-yield study points synthesized from your material. NoteGen AI does not claim these are guaranteed exam questions.
        </div>

        <div className="space-y-2">
          {result.examRevisionPoints.map((rp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3"
            >
              <span
                className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  rp.priority === 'Must Know'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : rp.priority === 'High Value'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {rp.priority}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-300 text-xs mr-2">
                  [{rp.category}]
                </span>
                <span className="text-xs text-slate-200 leading-relaxed">
                  {rp.point}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
