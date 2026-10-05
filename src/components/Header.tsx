import React, { useState } from 'react';
import { Sparkles, BookOpen, RotateCcw, FileDown, Download, Share2, Check, Printer } from 'lucide-react';
import { AnalysisResult } from '../types';
import { generateMarkdownExport, downloadTextFile } from '../utils/export';
import { exportResultToPdf } from '../utils/exportPdf';
import { WorkflowTab } from './WorkflowNav';

interface HeaderProps {
  result: AnalysisResult | null;
  onReset: () => void;
  activeTab?: WorkflowTab;
}

export const Header: React.FC<HeaderProps> = ({ result, onReset, activeTab = 'notes' }) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = () => {
    if (!result) return;
    setIsExportingPdf(true);
    try {
      const isCram = activeTab === 'cram';
      const filename = isCram ? 'NoteGen_AI_CramSheet.pdf' : 'NoteGen_AI_Notes.pdf';
      exportResultToPdf(result, {
        mode: isCram ? 'cram' : 'full',
        filename,
      });
    } catch (err) {
      console.error('[NoteGen AI] PDF Export Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!result) return;
    const md = generateMarkdownExport(result);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const md = generateMarkdownExport(result);
    const cleanTitle = result.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadTextFile(md, `${cleanTitle || 'notegen-notes'}.md`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                NoteGen <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">AI</span>
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Turn your study material into your personal exam strategy.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {result && (
            <>
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                title="Export / Download as PDF"
                className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-600/30 hover:border-indigo-400 hover:text-white shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FileDown className="h-3.5 w-3.5 text-indigo-400" />
                <span>{isExportingPdf ? 'Generating...' : 'Export PDF'}</span>
              </button>

              <button
                onClick={handlePrint}
                title="Browser Print Preview"
                className="no-print hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-slate-400" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                title="Download Markdown"
                className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden md:inline">Export .MD</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                title="Copy formatted markdown notes"
                className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-indigo-400" />}
                <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy Notes'}</span>
              </button>

              <div className="h-5 w-px bg-slate-800" />

              <button
                onClick={onReset}
                className="no-print inline-flex items-center gap-1.5 rounded-lg bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>New Upload</span>
              </button>
            </>
          )}

          {!result && (
            <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 sm:flex">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Adaptive Exam Intelligence</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
