export type ExplanationLevel = 'beginner' | 'standard' | 'exam-ready';

export interface DefinitionItem {
  term: string;
  explanation: string;
  contextOrUsage?: string;
}

export interface FormulaItem {
  name: string;
  formula: string;
  variables: string[];
  explanation: string;
  sourceContext: string;
}

export interface TopicNoteItem {
  topicTitle: string;
  simpleExplanation: string;
  importantConcepts: string[];
  definitions: Array<{ term: string; explanation: string }>;
  examples: string[];
  sourceReference: string;
  examYield: 'High' | 'Medium' | 'Low';
  commonMistake: string;
}

export interface KeyPointItem {
  point: string;
  importance: 'Critical' | 'Important' | 'Supplementary';
  category: string;
}

export interface ExamRevisionPoint {
  point: string;
  category: string;
  priority: 'Must Know' | 'High Value' | 'Good to Know';
}

export interface TimeAllocationAdvice {
  topic: string;
  percentage: number;
  rationale: string;
}

export interface ExaminerPitfall {
  topic: string;
  trap: string;
  howToAvoid: string;
}

export interface PrioritizationMatrix {
  focusSummary: string;
  highYieldTopics: string[];
  mediumYieldTopics: string[];
  lowYieldTopics: string[];
  timeAllocationAdvice: TimeAllocationAdvice[];
  examinerPitfalls: ExaminerPitfall[];
}

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topicReference: string;
  difficulty: QuestionDifficulty;
}

export interface FlashcardItem {
  id: string;
  topic: string;
  front: string;
  back: string;
  examTip?: string;
  difficulty?: QuestionDifficulty;
}

export interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  status: 'Strong' | 'Moderate' | 'Weak';
  reason: string;
  recommendedRevisionTime: string;
  missedQuestions: QuizQuestion[];
}

export interface TopicRevisionSession {
  topic: string;
  recommendedStudyTime: string;
  conceptBreakdown: string;
  keyFormulasOrTerms: Array<{ term: string; explanation: string }>;
  commonExaminerTraps: string[];
  remedialTips: string[];
  miniQuiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface ExamIntelligenceProfile {
  subject: string;
  examDate: string;
  dailyStudyHours: number;
  confidenceLevel: 'Low' | 'Moderate' | 'High';
  syllabusWeightage?: string;
}

export interface ExamIntelligencePlan {
  highPriorityTopics: Array<{
    topic: string;
    whyPriority: string;
    targetMarksOrYield: string;
    timeAllocation: string;
  }>;
  mediumPriorityTopics: Array<{
    topic: string;
    whyPriority: string;
    timeAllocation: string;
  }>;
  lowPriorityTopics: Array<{
    topic: string;
    whyPriority: string;
    timeAllocation: string;
  }>;
  totalRecommendedStudyHours: number;
  recommendedRevisionOrder: Array<{
    step: number;
    topic: string;
    objective: string;
    duration: string;
    phase: 'Foundational' | 'High-Yield Drill' | 'Edge-Case Polish' | 'Mock Test';
  }>;
  examReadinessSummary: string;
}

export type EmergencyDuration = 10 | 20 | 30 | 60 | 120;

export interface EmergencyBlock {
  timeRange: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  activityType: 'Core Concept' | 'Weak Topic Recovery' | 'Formula & Definition Blitz' | 'Flashcards Blitz' | 'Rapid Quiz';
  topic: string;
  actionableTask: string;
  quickMnemonicOrKeyPoint: string;
}

export interface EmergencyRevisionPlan {
  totalDurationMin: EmergencyDuration;
  urgencyLevel: string;
  executiveStrategy: string;
  blocks: EmergencyBlock[];
  finalWordsOfWisdom: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  data: string; // base64
  mimeType: string;
}

export interface AnalysisResult {
  metadata: {
    title: string;
    subject: string;
    estimatedStudyTime: string;
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    totalTopicsCount: number;
    chapters: string[];
  };
  summary: {
    quickSummary: string;
    keyTakeaway: string;
    corePremise: string;
  };
  keyPoints: KeyPointItem[];
  topicNotes: TopicNoteItem[];
  definitions: DefinitionItem[];
  formulas: FormulaItem[];
  hasFormulas: boolean;
  formulasNote?: string;
  examRevisionPoints: ExamRevisionPoint[];
  prioritizationMatrix: PrioritizationMatrix;
  practiceQuiz: QuizQuestion[];
  flashcards: FlashcardItem[];
  explanationLevel: ExplanationLevel;
  timestamp: number;
  sourceInfo: {
    fileName: string;
    sourceType: 'pdf' | 'text' | 'sample';
    fileSizeFormatted?: string;
    totalFiles?: number;
    filesList?: Array<{ name: string; size?: string }>;
  };
}

export interface SampleMaterial {
  id: string;
  title: string;
  subject: string;
  description: string;
  iconName: string;
  tag: string;
  content: string;
}
