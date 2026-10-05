import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Dna, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Plus,
  Trash2,
  Files
} from 'lucide-react';
import { ExplanationLevel, SampleMaterial, UploadedFileItem } from '../types';
import { SAMPLE_MATERIALS } from '../data/sampleMaterials';
import { formatFileSize } from '../utils/export';

interface UploadSectionProps {
  onAnalyze: (payload: {
    fileData?: string;
    files?: UploadedFileItem[];
    mimeType?: string;
    fileName?: string;
    fileSizeFormatted?: string;
    textContent?: string;
    level: ExplanationLevel;
    sourceType: 'pdf' | 'text' | 'sample';
  }) => void;
  isLoading: boolean;
  explanationLevel: ExplanationLevel;
  onExplanationLevelChange: (level: ExplanationLevel) => void;
}

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  onAnalyze, 
  isLoading,
  explanationLevel,
  onExplanationLevelChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Over
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processSingleFile = (file: File): Promise<UploadedFileItem | null> => {
    return new Promise((resolve) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setErrorMessage(`"${file.name}" is not a PDF file. Only PDF study documents are supported.`);
        resolve(null);
        return;
      }

      if (file.size === 0) {
        setErrorMessage(`"${file.name}" is empty (0 bytes).`);
        resolve(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit (${formatFileSize(file.size)}).`);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Clean = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        const item: UploadedFileItem = {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          data: base64Clean,
          mimeType: 'application/pdf',
        };
        resolve(item);
      };
      reader.onerror = () => {
        setErrorMessage(`Failed to read "${file.name}". Please try uploading again.`);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const validateAndProcessFiles = async (filesList: File[]) => {
    if (!filesList || filesList.length === 0) return;
    setErrorMessage(null);

    const promises = filesList.map((f) => processSingleFile(f));
    const results = await Promise.all(promises);
    const validNewFiles = results.filter((item): item is UploadedFileItem => item !== null);

    if (validNewFiles.length > 0) {
      setUploadedFiles((prev) => {
        // Filter out duplicates by filename and size
        const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
        const filteredNew = validNewFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
        return [...prev, ...filteredNew];
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (idToRemove: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== idToRemove));
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sample: SampleMaterial) => {
    setErrorMessage(null);
    setActiveTab('paste');
    setPastedText(sample.content);
  };

  const totalBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSubmit = () => {
    setErrorMessage(null);

    if (activeTab === 'upload') {
      if (uploadedFiles.length === 0) {
        setErrorMessage('Please select or drop at least one PDF study document.');
        return;
      }

      if (uploadedFiles.length === 1) {
        const single = uploadedFiles[0];
        onAnalyze({
          fileData: single.data,
          files: uploadedFiles,
          mimeType: 'application/pdf',
          fileName: single.name,
          fileSizeFormatted: single.sizeFormatted,
          level: explanationLevel,
          sourceType: 'pdf',
        });
      } else {
        const namesSummary = uploadedFiles.map((f) => f.name.replace(/\.pdf$/i, '')).join(', ');
        const displayTitle = namesSummary.length > 70 ? `${namesSummary.substring(0, 67)}...` : namesSummary;

        onAnalyze({
          fileData: uploadedFiles[0].data, // Fallback for single-file consumers
          files: uploadedFiles,
          mimeType: 'application/pdf',
          fileName: `${uploadedFiles.length} Documents: ${displayTitle}`,
          fileSizeFormatted: formatFileSize(totalBytes),
          level: explanationLevel,
          sourceType: 'pdf',
        });
      }
    } else {
      const trimmed = pastedText.trim();
      if (!trimmed) {
        setErrorMessage('Please paste your lecture notes or study material in the text area.');
        return;
      }
      if (trimmed.length < 50) {
        setErrorMessage('Study material is too short. Please provide at least 2-3 paragraphs for comprehensive exam strategy synthesis.');
        return;
      }

      onAnalyze({
        textContent: trimmed,
        fileName: 'Pasted Study Material',
        level: explanationLevel,
        sourceType: 'text',
      });
    }
  };

  // Word count & Char count for text mode
  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const charCount = pastedText.length;

  const getSampleIcon = (name: string) => {
    switch (name) {
      case 'Cpu': return <Cpu className="h-4 w-4 text-sky-400" />;
      case 'Dna': return <Dna className="h-4 w-4 text-emerald-400" />;
      case 'Zap': return <Zap className="h-4 w-4 text-amber-400" />;
      case 'TrendingUp': return <TrendingUp className="h-4 w-4 text-indigo-400" />;
      default: return <BookOpen className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      {/* Hero Heading */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Multi-Document Exam Intelligence Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
          Turn your study material into your{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
            personal exam strategy
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Upload single or multiple lecture slides, syllabus chapters, and PDFs. NoteGen AI extracts key concepts, formulas, definitions, and high-yield exam traps into an active study workflow.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Navigation Tabs (Upload PDF vs Paste Text) */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 sm:p-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload PDFs {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Paste Lecture Notes</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: Upload Multiple PDFs */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Hidden file input supporting multiple selection */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
              />

              {uploadedFiles.length === 0 ? (
                /* Empty Dropzone State */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : 'border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                    <UploadCloud className="h-8 w-8 text-indigo-400" />
                  </div>

                  <p className="text-base font-semibold text-white">
                    Drop your lecture PDFs here, or <span className="text-indigo-400 underline underline-offset-4">browse files</span>
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 max-w-md">
                    Select single or multiple PDF documents (lecture slides, textbook chapters, problem sets)
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-slate-500">
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-slate-300">Multiple PDFs Supported</span>
                    <span>•</span>
                    <span>Max {MAX_FILE_SIZE_MB}MB per file</span>
                  </div>
                </div>
              ) : (
                /* Multi-File Selected View */
                <div className="space-y-3">
                  {/* Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Files className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">
                        Selected Documents ({uploadedFiles.length})
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatFileSize(totalBytes)} total
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-colors cursor-pointer"
                        title="Add more PDF documents"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add More PDFs</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove all files"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Files with individual remove buttons */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-3.5 py-2.5 transition-colors hover:border-indigo-500/40"
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white">
                              <span className="text-slate-500 mr-1.5 font-mono text-[10px]">#{idx + 1}</span>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {file.sizeFormatted} • PDF Document
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="ml-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Remove ${file.name}`}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Secondary mini-dropzone when files are already present */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 px-4 text-xs font-medium cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-indigo-400" />
                    <span>Drop additional PDFs here or click to add more</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your raw lecture notes, syllabus chapter, reading material, or exam outline here..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-slate-800">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Explanation Level Selector */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span>Explanation Calibration Level</span>
                <Info className="h-3.5 w-3.5 text-slate-500" />
              </label>
              <span className="text-[11px] text-slate-400">
                Tailors conceptual tone and depth
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Explanation Calibration Level">
              {/* Beginner */}
              <button
                type="button"
                role="radio"
                aria-checked={explanationLevel === 'beginner'}
                tabIndex={0}
                onClick={() => onExplanationLevelChange('beginner')}
                className={`flex flex-col text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                  explanationLevel === 'beginner'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/60'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${explanationLevel === 'beginner' ? 'text-emerald-300' : 'text-slate-200'}`}>
                    Beginner
                  </span>
                  {explanationLevel === 'beginner' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Simple language, everyday real-world analogies, step-by-step breakdown.
                </p>
              </button>

              {/* Standard */}
              <button
                type="button"
                role="radio"
                aria-checked={explanationLevel === 'standard'}
                tabIndex={0}
                onClick={() => onExplanationLevelChange('standard')}
                className={`flex flex-col text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                  explanationLevel === 'standard'
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-100 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/60'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${explanationLevel === 'standard' ? 'text-indigo-300' : 'text-slate-200'}`}>
                    Standard
                  </span>
                  {explanationLevel === 'standard' ? (
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Balanced college-level rigor & clarity, standard textbook depth.
                </p>
              </button>

              {/* Exam Ready */}
              <button
                type="button"
                role="radio"
                aria-checked={explanationLevel === 'exam-ready'}
                tabIndex={0}
                onClick={() => onExplanationLevelChange('exam-ready')}
                className={`flex flex-col text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                  explanationLevel === 'exam-ready'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-100 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/60'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${explanationLevel === 'exam-ready' ? 'text-amber-300' : 'text-slate-200'}`}>
                    Exam Ready
                  </span>
                  {explanationLevel === 'exam-ready' ? (
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  High-density cheat-sheet mode, examiner keywords & trick traps.
                </p>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-7">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] hover:shadow-indigo-600/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {activeTab === 'upload' && uploadedFiles.length > 1
                  ? `Synthesize ${uploadedFiles.length} Documents & Generate Strategy`
                  : 'Generate Smart Notes & Exam Strategy'}
              </span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Quick Sample Materials Carousel / Grid */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-5 sm:p-6">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">
                Or test with sample college lectures:
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">1-Click Demo</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {SAMPLE_MATERIALS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="group flex items-start gap-3 rounded-xl border border-slate-800/90 bg-slate-900/60 p-3 text-left transition-all hover:border-indigo-500/40 hover:bg-slate-800/60 cursor-pointer"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700/60 group-hover:border-indigo-500/30">
                  {getSampleIcon(sample.iconName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                      {sample.title}
                    </span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300 uppercase flex-shrink-0">
                      Demo Mode
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                    {sample.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
