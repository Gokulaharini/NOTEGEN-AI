import React, { useState } from 'react';
import { 
  Zap, 
  Printer, 
  FileDown,
  Copy, 
  Check, 
  Bookmark, 
  Calculator, 
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { exportResultToPdf } from '../utils/exportPdf';

interface CramSheetViewProps {
  result: AnalysisResult;
}

export const CramSheetView: React.FC<CramSheetViewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      exportResultToPdf(result, {
        mode: 'cram',
        filename: 'NoteGen_AI_CramSheet.pdf',
      });
    } catch (err) {
      console.error('[NoteGen AI] Cram PDF Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    let text = `=== ${result.metadata.title.toUpperCase()} — 5-MINUTE CRAM SHEET ===\n`;
    text += `Subject: ${result.metadata.subject} | Level: ${result.explanationLevel}\n\n`;
    text += `CORE SUMMARY:\n${result.summary.quickSummary}\n\n`;
    text += `TOP EXAM REVISION POINTS:\n`;
    result.examRevisionPoints.forEach((p, i) => {
      text += `${i + 1}. [${p.priority}] ${p.point}\n`;
    });
    text += `\nMUST-KNOW DEFINITIONS:\n`;
    result.definitions.slice(0, 10).forEach((d) => {
      text += `• ${d.term} → ${d.explanation}\n`;
    });
    if (result.hasFormulas && result.formulas.length > 0) {
      text += `\nKEY FORMULAS:\n`;
      result.formulas.forEach((f) => {
        text += `• ${f.name}: ${f.formula} (${f.explanation})\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 pb-16 print-area">
      {/* Top Banner */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              5-Minute Pre-Exam Cram Sheet
            </h3>
            <p className="text-xs text-slate-400">
              High-density, single-view emergency summary ready for print or quick phone review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            title="Download formatted Cram Sheet as PDF"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Browser print preview"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* The Printable Cram Sheet Document */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl print-card">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-5 mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
              NoteGen AI • Emergency Cram Sheet
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {result.metadata.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Subject: {result.metadata.subject} • Level: {result.explanationLevel.toUpperCase()}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Est. Cram Time</span>
            <span className="text-sm font-bold text-amber-400 font-mono">5 Minutes</span>
          </div>
        </div>

        {/* 1. Quick Takeaway & Core Premise */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
            Core Concept in 60 Seconds
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {result.summary.quickSummary}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300">
            <strong>Key Takeaway:</strong> {result.summary.keyTakeaway}
          </div>
        </div>

        {/* 2. Top Must-Know Revision Points */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Top Must-Know Exam Points
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.examRevisionPoints.slice(0, 8).map((rp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5"
              >
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                  {idx + 1}
                </span>
                <span className="text-slate-200 text-[11px] leading-relaxed">
                  <strong className="text-indigo-300">[{rp.category}]</strong> {rp.point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Formulas Cheat Grid */}
        {result.hasFormulas && result.formulas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Essential Mathematical Formulas
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {result.formulas.map((f, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-300 text-xs">{f.name}</span>
                    <span className="text-[10px] text-slate-400">{f.sourceContext}</span>
                  </div>
                  <div className="my-1.5 rounded bg-slate-950/80 px-2 py-1.5 font-mono text-xs font-bold text-amber-200 border border-amber-500/30">
                    {f.formula}
                  </div>
                  <p className="text-[11px] text-slate-300">{f.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Critical Definitions Matrix */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Must-Memorize Definitions (TERM → Meaning)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.definitions.slice(0, 10).map((d, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-[11px]"
              >
                <span className="font-bold text-emerald-400 block mb-0.5">
                  {d.term}
                </span>
                <span className="text-slate-300">{d.explanation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom watermark */}
        <div className="mt-8 border-t border-slate-800/80 pt-4 flex items-center justify-between text-[10px] text-slate-500">
          <span>NoteGen AI • Turn your study material into your personal exam strategy</span>
          <span>Generated on {new Date(result.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
