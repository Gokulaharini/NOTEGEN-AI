import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High limit for handling lecture PDFs and documents in base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini initialization with required telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient model fallback pool to guarantee 100% uptime during regional high demand spikes
const RESILIENT_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Retry helper with multi-model fallback and low-latency thinking calibration
async function generateContentWithRetry(ai: GoogleGenAI, baseParams: any, maxRetries = 3) {
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Attempt 0 uses requested model; subsequent attempts fallback through resilient alternative pools
    const modelToUse = attempt === 0
      ? (baseParams.model || RESILIENT_MODELS[0])
      : RESILIENT_MODELS[Math.min(attempt, RESILIENT_MODELS.length - 1)];

    // Deep clone params for this attempt
    const params = {
      ...baseParams,
      model: modelToUse,
      config: {
        ...baseParams.config,
      },
    };

    // For gemini-3 models, apply ThinkingLevel.LOW to avoid heavy reasoning queues during peak times
    if (modelToUse.includes('gemini-3') && !params.config.thinkingConfig) {
      params.config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    } else if (!modelToUse.includes('gemini-3')) {
      // Non gemini-3 models do not support thinkingConfig
      delete params.config.thinkingConfig;
    }

    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const isTransient =
        error?.status === 503 ||
        error?.status === 429 ||
        error?.message?.includes('503') ||
        error?.message?.includes('high demand') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('overloaded');

      if (isTransient && attempt < maxRetries - 1) {
        const nextModel = RESILIENT_MODELS[Math.min(attempt + 1, RESILIENT_MODELS.length - 1)];
        const delayMs = 500 * (attempt + 1);
        console.log(`[NoteGen AI] Model ${modelToUse} is experiencing high demand. Seamlessly switching to ${nextModel}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else if (!isTransient) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Failed to generate content after resilient fallback attempts.');
}


// Response schema for structured notes & exam strategy
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Document or lecture title' },
        subject: { type: Type.STRING, description: 'Academic subject or domain' },
        estimatedStudyTime: { type: Type.STRING, description: 'Estimated time required to master (e.g. 45 mins)' },
        difficultyLevel: { type: Type.STRING, description: 'Beginner, Intermediate, or Advanced' },
        totalTopicsCount: { type: Type.NUMBER, description: 'Number of major topics covered' },
        chapters: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of chapter or module names found'
        },
      },
      required: ['title', 'subject', 'estimatedStudyTime', 'difficultyLevel', 'totalTopicsCount', 'chapters'],
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        quickSummary: { type: Type.STRING, description: 'A concise explanation of the entire document' },
        keyTakeaway: { type: Type.STRING, description: 'The single most critical takeaway for an exam' },
        corePremise: { type: Type.STRING, description: 'The fundamental theoretical foundation or problem being solved' },
      },
      required: ['quickSummary', 'keyTakeaway', 'corePremise'],
    },
    keyPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          importance: { type: Type.STRING, description: 'Critical, Important, or Supplementary' },
          category: { type: Type.STRING, description: 'Conceptual, Practical, or Methodological' },
        },
        required: ['point', 'importance', 'category'],
      },
      description: 'Important concepts as bullet points',
    },
    topicNotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topicTitle: { type: Type.STRING },
          simpleExplanation: { type: Type.STRING, description: 'Explanation calibrated to requested level' },
          importantConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          definitions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['term', 'explanation'],
            },
          },
          examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Examples actually present in source material',
          },
          sourceReference: { type: Type.STRING, description: 'Section, page, or lecture part reference' },
          examYield: { type: Type.STRING, description: 'High, Medium, or Low' },
          commonMistake: { type: Type.STRING, description: 'Frequent misconception or student blunder' },
        },
        required: ['topicTitle', 'simpleExplanation', 'importantConcepts', 'definitions', 'examples', 'sourceReference', 'examYield', 'commonMistake'],
      },
    },
    definitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          explanation: { type: Type.STRING, description: 'Simple, direct explanation: TERM -> Simple explanation' },
          contextOrUsage: { type: Type.STRING },
        },
        required: ['term', 'explanation'],
      },
      description: 'Important Definitions in TERM -> Simple explanation format',
    },
    formulas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          formula: { type: Type.STRING },
          variables: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          explanation: { type: Type.STRING },
          sourceContext: { type: Type.STRING },
        },
        required: ['name', 'formula', 'variables', 'explanation', 'sourceContext'],
      },
      description: 'Only genuine formulas found or reliably derived from source. Never fabricate.',
    },
    hasFormulas: { type: Type.BOOLEAN },
    formulasNote: { type: Type.STRING },
    examRevisionPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          category: { type: Type.STRING },
          priority: { type: Type.STRING, description: 'Must Know, High Value, or Good to Know' },
        },
        required: ['point', 'category', 'priority'],
      },
      description: 'Concise high-yield points useful for revision. Clearly distinct from guaranteed questions.',
    },
    prioritizationMatrix: {
      type: Type.OBJECT,
      properties: {
        focusSummary: { type: Type.STRING, description: 'Strategic advice on where to invest study hours' },
        highYieldTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        mediumYieldTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        lowYieldTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        timeAllocationAdvice: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              percentage: { type: Type.NUMBER, description: 'Recommended percentage of total study time (e.g. 40)' },
              rationale: { type: Type.STRING },
            },
            required: ['topic', 'percentage', 'rationale'],
          },
        },
        examinerPitfalls: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              trap: { type: Type.STRING, description: 'The sneaky exam question trap' },
              howToAvoid: { type: Type.STRING, description: 'How to answer correctly' },
            },
            required: ['topic', 'trap', 'howToAvoid'],
          },
        },
      },
      required: ['focusSummary', 'highYieldTopics', 'mediumYieldTopics', 'lowYieldTopics', 'timeAllocationAdvice', 'examinerPitfalls'],
    },
    practiceQuiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 multiple-choice options',
          },
          correctIndex: { type: Type.NUMBER, description: '0, 1, 2, or 3' },
          explanation: { type: Type.STRING, description: 'Detailed rationale of why the answer is correct' },
          topicReference: { type: Type.STRING },
          difficulty: { type: Type.STRING, description: 'Easy, Medium, or Hard' },
        },
        required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'topicReference', 'difficulty'],
      },
      description: '6 to 10 high-quality exam-style questions testing concepts from the material with varied difficulties (Easy, Medium, Hard)',
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          front: { type: Type.STRING, description: 'Prompt, question, or key term' },
          back: { type: Type.STRING, description: 'Crisp answer, definition, or solution' },
          examTip: { type: Type.STRING, description: 'Memory trigger or exam tip' },
          difficulty: { type: Type.STRING, description: 'Easy, Medium, or Hard' },
        },
        required: ['id', 'topic', 'front', 'back', 'examTip'],
      },
      description: '8 to 15 active recall flashcards for spaced repetition',
    },
  },
  required: [
    'metadata',
    'summary',
    'keyPoints',
    'topicNotes',
    'definitions',
    'formulas',
    'hasFormulas',
    'examRevisionPoints',
    'prioritizationMatrix',
    'practiceQuiz',
    'flashcards',
  ],
};

// API Route: Analyze study material and generate smart notes + exam workflow
app.post('/api/analyze-notes', async (req: Request, res: Response) => {
  try {
    const { fileData, files, mimeType, fileName, textContent, level = 'standard', sourceType = 'text' } = req.body;

    const hasFiles = Boolean(files && Array.isArray(files) && files.length > 0);
    if (!fileData && !hasFiles && (!textContent || textContent.trim().length === 0)) {
      return res.status(400).json({
        error: 'No study material provided. Please upload PDF files or paste your lecture text.',
      });
    }

    if (textContent && textContent.trim().length < 40 && !fileData && !hasFiles) {
      return res.status(400).json({
        error: 'The provided text is too short to generate comprehensive study notes. Please provide at least a few sentences or paragraphs.',
      });
    }

    const ai = getGeminiClient();

    // Calibration based on user selected explanation level
    let levelInstruction = '';
    if (level === 'beginner') {
      levelInstruction = `
EXPLANATION LEVEL: BEGINNER
- Explain concepts using simple, plain, approachable language.
- Use intuitive, everyday real-world analogies to make abstract ideas stick.
- Break multi-step mechanisms into gentle, bite-sized stages.
- Avoid unexplained jargon: if a technical term is introduced, define it immediately in simple words.
`;
    } else if (level === 'exam-ready') {
      levelInstruction = `
EXPLANATION LEVEL: EXAM READY
- High-density, high-yield, compact cheat-sheet style.
- Highlight critical technical keywords examiners award points for.
- Emphasize boundary conditions, tricky exceptions, and common examiner traps.
- Rapid active recall cues, memory hooks, and precision phrasing.
`;
    } else {
      levelInstruction = `
EXPLANATION LEVEL: STANDARD
- Balanced university-level rigor and clarity.
- Clear structural flow, accurate definitions, and thorough conceptual explanations.
- Grounded in standard academic textbook conventions.
`;
    }

    const systemPrompt = `
You are NoteGen AI: "Turn your study material into your personal exam strategy."
Your mission is to transform college study materials into an adaptive, exam-oriented learning workflow.
Do not merely summarize the document. You must construct an active study plan.

CRITICAL RULES:
1. Ground truth: Only extract and synthesize information present in or directly derivable from the provided source material.
2. FORMULAS RULE: Only include formulas actually found or reliably derived from the material. NEVER fabricate or hallucinate mathematical formulas. If no formulas exist in the source, set formulas to [] and hasFormulas to false, with formulasNote explaining that no formulas were present in the source.
3. DEFINITIONS RULE: Provide definitions in the exact structure: TERM -> Simple explanation.
4. EXAM REVISION POINTS: Make these concise and punchy for quick revision before entering the exam room. Do not claim they are guaranteed questions.
5. PRACTICE QUIZ: Generate 5 to 7 realistic multiple-choice questions that test genuine understanding and common points of confusion. Provide 4 clear options and the 0-indexed correct option.
6. FLASHCARDS: Generate 8 to 12 active recall flashcards covering key definitions, processes, and trade-offs.
7. PRIORITIZATION MATRIX: Clearly designate High-Yield, Medium-Yield, and Low-Yield concepts, with percentage time allocation advice so the student knows where to focus first.

${levelInstruction}
`;

    const contents: any[] = [];

    if (hasFiles) {
      // Multiple PDF documents uploaded
      files.forEach((f: any) => {
        const docMime = f.mimeType || 'application/pdf';
        const docData = f.data || f.fileData;
        if (docData) {
          contents.push({
            inlineData: {
              mimeType: docMime,
              data: docData,
            },
          });
        }
      });

      const fileNamesList = files.map((f: any, idx: number) => `Doc ${idx + 1}: "${f.name || f.fileName || 'document.pdf'}"`).join(', ');
      contents.push({
        text: `You have been provided with ${files.length} study documents (${fileNamesList}).
Analyze and synthesize ALL of these documents together into a unified, coherent NoteGen AI Smart Notes and Exam Strategy JSON.
Cross-reference overlapping concepts across the documents, synthesize topics comprehensively, identify overarching exam themes, formulas, key definitions, and revision points from all provided materials.
Ensure that topic notes cover material from each document. Follow all structured JSON schema rules strictly.`,
      });
    } else if (fileData) {
      // Single PDF or file uploaded
      const effectiveMimeType = mimeType || 'application/pdf';
      contents.push({
        inlineData: {
          mimeType: effectiveMimeType,
          data: fileData,
        },
      });
      contents.push({
        text: `Analyze this uploaded document (${fileName || 'document.pdf'}) thoroughly and construct the complete NoteGen AI Smart Notes and Exam Strategy JSON. Follow all requirements strictly.`,
      });
    } else {
      // Pasted text or sample material
      contents.push({
        text: `Here is the student's study material:
---
${textContent}
---

Analyze this study material thoroughly and construct the complete NoteGen AI Smart Notes and Exam Strategy JSON. Follow all requirements strictly.`,
      });
    }

    console.log(`[NoteGen AI] Generating smart notes (level: ${level}, source: ${sourceType}, files: ${hasFiles ? files.length : (fileName || 'text')})...`);

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: analysisResponseSchema as any,
        temperature: 0.2, // Low temperature for high factual accuracy
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini model returned an empty response. Please verify your source material.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText.trim());
    } catch (parseError: any) {
      console.error('[NoteGen AI] JSON parse error:', parseError, responseText);
      throw new Error('Failed to parse AI response into structured notes. Please retry.');
    }

    // Attach metadata about the generation run
    parsedResult.explanationLevel = level;
    parsedResult.timestamp = Date.now();
    parsedResult.sourceInfo = {
      fileName: hasFiles && files.length > 1
        ? `${files.length} Documents: ${files.map((f: any) => f.name || f.fileName).join(', ')}`
        : (fileName || (sourceType === 'sample' ? 'Sample Material' : 'Pasted Text')),
      sourceType: sourceType,
      fileSizeFormatted: req.body.fileSizeFormatted,
      totalFiles: hasFiles ? files.length : (fileData ? 1 : undefined),
      filesList: hasFiles ? files.map((f: any) => ({ name: f.name || f.fileName, size: f.sizeFormatted })) : undefined,
    };

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('[NoteGen AI] Error processing study material:', error);
    const errorMessage = error?.message || 'Failed to analyze study material. Please try again.';
    return res.status(500).json({ error: errorMessage });
  }
});

// Additional API Route: Deep dive on a specific topic or generate targeted drill
app.post('/api/explain-deep-dive', async (req: Request, res: Response) => {
  try {
    const { topic, context, level = 'standard' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ai = getGeminiClient();
    const prompt = `
The student wants an exam-focused deep dive into this specific topic: "${topic}".
Context from their study notes:
${context || 'No specific context provided'}

Explanation Level: ${level}

Provide:
1. Intuitive breakdown / mental model
2. Step-by-step mechanism
3. 2 exam-style questions students commonly miss on this topic
4. A memorable mnemonic or quick formula cheat sheet
`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are NoteGen AI tutor helping a student master a tricky exam concept.',
      },
    });

    return res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('[NoteGen AI] Deep dive error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate deep dive explanation.' });
  }
});

// Dedicated Schema for on-demand Quiz generation
const quizOnlySchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      question: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Exactly 4 multiple-choice options',
      },
      correctIndex: { type: Type.NUMBER, description: '0, 1, 2, or 3' },
      explanation: { type: Type.STRING, description: 'Detailed rationale of why the answer is correct' },
      topicReference: { type: Type.STRING },
      difficulty: { type: Type.STRING, description: 'Easy, Medium, or Hard' },
    },
    required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'topicReference', 'difficulty'],
  },
};

// Dedicated Schema for on-demand Flashcards generation
const flashcardsOnlySchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      topic: { type: Type.STRING },
      front: { type: Type.STRING, description: 'Prompt, question, or key term' },
      back: { type: Type.STRING, description: 'Crisp answer, definition, or solution' },
      examTip: { type: Type.STRING, description: 'Memory trigger or exam tip' },
      difficulty: { type: Type.STRING, description: 'Easy, Medium, or Hard' },
    },
    required: ['id', 'topic', 'front', 'back', 'examTip'],
  },
};

// API Route: Generate a fresh AI Practice Quiz
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { studyContext, count = 8, difficulty = 'All', topic, fileData, mimeType, files } = req.body;
    const ai = getGeminiClient();

    let difficultyConstraint = 'Include a balanced mix of Easy, Medium, and Hard questions.';
    if (difficulty === 'Easy') difficultyConstraint = 'Every question MUST be Easy difficulty, focusing on fundamental definitions and direct concepts.';
    if (difficulty === 'Medium') difficultyConstraint = 'Every question MUST be Medium difficulty, testing multi-step understanding and application.';
    if (difficulty === 'Hard') difficultyConstraint = 'Every question MUST be Hard difficulty, testing tricky examiner edge-cases, common pitfalls, and calculation/analytical steps.';

    const systemPrompt = `
You are the NoteGen AI Active Learning Engine.
Your task is to generate exactly ${count} exam-oriented Multiple Choice Questions based strictly on the provided study material.
Requirements:
1. Exactly 4 options per question.
2. Indicate 0-indexed correct option (0, 1, 2, or 3).
3. Provide a clear, educational explanation of why the answer is correct.
4. Specify the source topic.
5. Specify difficulty: 'Easy', 'Medium', or 'Hard'. ${difficultyConstraint}
6. Do NOT fabricate information not present in the material.
${topic ? `Focus particularly on topic: "${topic}".` : ''}
`;

    const contents: any[] = [];
    if (files && Array.isArray(files) && files.length > 0) {
      files.forEach((f: any) => {
        const docData = f.data || f.fileData;
        if (docData) {
          contents.push({
            inlineData: {
              mimeType: f.mimeType || 'application/pdf',
              data: docData,
            },
          });
        }
      });
      contents.push({
        text: `Generate ${count} practice quiz questions covering all ${files.length} provided study documents. Follow all structured JSON schema rules.`,
      });
    } else if (fileData) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileData,
        },
      });
      contents.push({
        text: `Generate ${count} practice quiz questions from this document. Follow all structured JSON schema rules.`,
      });
    } else {
      contents.push({
        text: `Study Material:\n---\n${studyContext || 'No context provided'}\n---\nGenerate ${count} practice quiz questions. Follow all structured JSON schema rules.`,
      });
    }

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: quizOnlySchema as any,
        temperature: 0.25,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    return res.json({ questions: parsed });
  } catch (error: any) {
    console.error('[NoteGen AI] Generate quiz error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate practice quiz.' });
  }
});

// API Route: Generate fresh Active Recall Flashcards
app.post('/api/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { studyContext, count = 10, topic, fileData, mimeType, files } = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `
You are the NoteGen AI Active Learning Engine.
Your task is to generate exactly ${count} active recall flashcards based strictly on the provided study material.
Requirements:
1. Front: A clear, thought-provoking prompt, question, or key concept.
2. Back: A crisp, authoritative answer, mechanism breakdown, or definition.
3. ExamTip: A high-yield mnemonic or memory hook for exams.
4. Topic: The topic name.
5. Difficulty: 'Easy', 'Medium', or 'Hard'.
6. Do NOT invent facts not present in the source material.
${topic ? `Focus particularly on topic: "${topic}".` : ''}
`;

    const contents: any[] = [];
    if (files && Array.isArray(files) && files.length > 0) {
      files.forEach((f: any) => {
        const docData = f.data || f.fileData;
        if (docData) {
          contents.push({
            inlineData: {
              mimeType: f.mimeType || 'application/pdf',
              data: docData,
            },
          });
        }
      });
      contents.push({
        text: `Generate ${count} active recall flashcards covering all ${files.length} provided study documents. Follow all structured JSON schema rules.`,
      });
    } else if (fileData) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileData,
        },
      });
      contents.push({
        text: `Generate ${count} active recall flashcards from this document. Follow all structured JSON schema rules.`,
      });
    } else {
      contents.push({
        text: `Study Material:\n---\n${studyContext || 'No context provided'}\n---\nGenerate ${count} active recall flashcards. Follow all structured JSON schema rules.`,
      });
    }

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: flashcardsOnlySchema as any,
        temperature: 0.25,
      },
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text?.trim() || '[]');
    } catch {
      parsed = [];
    }

    let flashcardsList: any[] = [];
    if (Array.isArray(parsed)) {
      flashcardsList = parsed;
    } else if (parsed && Array.isArray(parsed.flashcards)) {
      flashcardsList = parsed.flashcards;
    }

    // Ensure every flashcard has a unique id, topic, front, and back
    const normalizedFlashcards = flashcardsList.map((card: any, idx: number) => ({
      id: String(card.id || `fc-${Date.now()}-${idx}`),
      topic: card.topic || 'Core Concept',
      front: card.front || card.question || 'Question / Concept Prompt',
      back: card.back || card.answer || 'Answer & Explanation',
      examTip: card.examTip || '',
      difficulty: card.difficulty || 'Medium',
    }));

    return res.json({ flashcards: normalizedFlashcards });
  } catch (error: any) {
    console.error('[NoteGen AI] Generate flashcards error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate flashcards.' });
  }
});

// Dedicated Schema for Topic Revision Session & Mini-Quiz
const revisionSessionSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    recommendedStudyTime: { type: Type.STRING, description: 'e.g., 15 minutes' },
    conceptBreakdown: { type: Type.STRING, description: 'Clear, high-yield explanation addressing core concepts and misconceptions' },
    keyFormulasOrTerms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['term', 'explanation'],
      },
    },
    commonExaminerTraps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific pitfalls or traps examiners set for this topic',
    },
    remedialTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Actionable tips for mastering this concept before the exam',
    },
    miniQuiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 options',
          },
          correctIndex: { type: Type.NUMBER, description: '0, 1, 2, or 3' },
          explanation: { type: Type.STRING },
        },
        required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
      },
      description: 'Exactly 3 targeted questions to verify recovery on this topic',
    },
  },
  required: [
    'topic',
    'recommendedStudyTime',
    'conceptBreakdown',
    'keyFormulasOrTerms',
    'commonExaminerTraps',
    'remedialTips',
    'miniQuiz',
  ],
};

// API Route: Generate focused remedial explanation and 3-question mini-quiz for a weak topic
app.post('/api/revise-topic', async (req: Request, res: Response) => {
  try {
    const { topic, accuracy, missedQuestions, studyContext, fileData, mimeType } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required for revision session.' });
    }

    const ai = getGeminiClient();

    const systemPrompt = `
You are NoteGen AI Remedial Study Coach.
The student performed poorly on topic: "${topic}" (Accuracy: ${accuracy || 0}%).
Missed questions context: ${JSON.stringify(missedQuestions || [])}.

Your objective:
1. Provide a crystal-clear, focused conceptual breakdown that directly corrects the misconception without confusing theory.
2. Extract the must-remember terms or authentic formulas.
3. List 2-3 specific examiner traps for this topic.
4. Give 2-3 actionable memory cues.
5. Create exactly 3 diagnostic mini-quiz questions (4 options, correct answer, and explanation) to test if they have now mastered this topic.
`;

    const contents: any[] = [];
    if (fileData) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileData,
        },
      });
      contents.push({
        text: `Synthesize a targeted revision session for weak topic: "${topic}". Follow the structured schema.`,
      });
    } else {
      contents.push({
        text: `Original Study Material:\n---\n${studyContext || 'No context provided'}\n---\nSynthesize a targeted revision session for weak topic: "${topic}". Follow the structured schema.`,
      });
    }

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: revisionSessionSchema as any,
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('[NoteGen AI] Revise topic error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate topic revision.' });
  }
});

// Dedicated Schema for Exam Intelligence Planning
const examIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    highPriorityTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          whyPriority: { type: Type.STRING },
          targetMarksOrYield: { type: Type.STRING },
          timeAllocation: { type: Type.STRING },
        },
        required: ['topic', 'whyPriority', 'targetMarksOrYield', 'timeAllocation'],
      },
    },
    mediumPriorityTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          whyPriority: { type: Type.STRING },
          timeAllocation: { type: Type.STRING },
        },
        required: ['topic', 'whyPriority', 'timeAllocation'],
      },
    },
    lowPriorityTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          whyPriority: { type: Type.STRING },
          timeAllocation: { type: Type.STRING },
        },
        required: ['topic', 'whyPriority', 'timeAllocation'],
      },
    },
    totalRecommendedStudyHours: { type: Type.NUMBER },
    recommendedRevisionOrder: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.NUMBER },
          topic: { type: Type.STRING },
          objective: { type: Type.STRING },
          duration: { type: Type.STRING },
          phase: { type: Type.STRING },
        },
        required: ['step', 'topic', 'objective', 'duration', 'phase'],
      },
    },
    examReadinessSummary: { type: Type.STRING },
  },
  required: [
    'highPriorityTopics',
    'mediumPriorityTopics',
    'lowPriorityTopics',
    'totalRecommendedStudyHours',
    'recommendedRevisionOrder',
    'examReadinessSummary',
  ],
};

// Dedicated Schema for Emergency "I Have Only X Minutes" Revision Plan
const emergencyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    totalDurationMin: { type: Type.NUMBER },
    urgencyLevel: { type: Type.STRING },
    executiveStrategy: { type: Type.STRING },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeRange: { type: Type.STRING, description: 'e.g. 0–5 min' },
          startMin: { type: Type.NUMBER },
          endMin: { type: Type.NUMBER },
          durationMin: { type: Type.NUMBER },
          activityType: { type: Type.STRING },
          topic: { type: Type.STRING },
          actionableTask: { type: Type.STRING },
          quickMnemonicOrKeyPoint: { type: Type.STRING },
        },
        required: [
          'timeRange',
          'startMin',
          'endMin',
          'durationMin',
          'activityType',
          'topic',
          'actionableTask',
          'quickMnemonicOrKeyPoint',
        ],
      },
    },
    finalWordsOfWisdom: { type: Type.STRING },
  },
  required: ['totalDurationMin', 'urgencyLevel', 'executiveStrategy', 'blocks', 'finalWordsOfWisdom'],
};

// API Route: Generate personalized Exam Intelligence Strategy
app.post('/api/exam-intelligence', async (req: Request, res: Response) => {
  try {
    const { profile, studyContext, quizStats, weakTopics, fileData, mimeType } = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `
You are the NoteGen AI Exam Intelligence Strategist.
The student has provided their exam constraints:
- Subject: ${profile?.subject || 'University Course'}
- Exam Date: ${profile?.examDate || 'Upcoming soon'}
- Available Daily Study Time: ${profile?.dailyStudyHours || 2} hours/day
- Current Confidence Level: ${profile?.confidenceLevel || 'Moderate'}
- Optional Syllabus Weightage: ${profile?.syllabusWeightage || 'Standard curriculum distribution'}
- Existing Quiz Performance: ${JSON.stringify(quizStats || {})}
- Identified Weak Topics: ${JSON.stringify(weakTopics || [])}

Instructions:
1. Synthesize High, Medium, and Low Priority topics based on syllabus weightage, quiz vulnerabilities, and high-yield concepts.
2. Provide a practical recommended study time allocation for each.
3. Formulate a step-by-step Recommended Revision Order (Step 1, Step 2, ...) leading up to the exam.
4. ABSOLUTE COMPLIANCE RULE: Do NOT claim that any topic is guaranteed to appear in the exam. Use objective, probabilistic phrasing like "High-Yield Priority", "Frequently Tested Concept", or "Syllabus Core Area".
`;

    const contents: any[] = [];
    if (fileData) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileData,
        },
      });
      contents.push({
        text: `Generate the complete Exam Intelligence Plan following the structured schema.`,
      });
    } else {
      contents.push({
        text: `Study Material:\n---\n${studyContext || 'No context'}\n---\nGenerate the complete Exam Intelligence Plan following the structured schema.`,
      });
    }

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: examIntelligenceSchema as any,
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('[NoteGen AI] Exam intelligence error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate exam intelligence.' });
  }
});

// API Route: Generate Emergency Crunch Revision Plan ("I HAVE ONLY X MINUTES")
app.post('/api/emergency-plan', async (req: Request, res: Response) => {
  try {
    const { durationMinutes = 30, weakTopics = [], highYieldTopics = [], subject, studyContext } = req.body;
    const ai = getGeminiClient();

    const allowedDurations = [10, 20, 30, 60, 120];
    const duration = allowedDurations.includes(Number(durationMinutes)) ? Number(durationMinutes) : 30;

    const systemPrompt = `
You are the NoteGen AI Emergency Revision Engine.
The student has an urgent situation: "I HAVE ONLY ${duration} MINUTES BEFORE MY EXAM!"

Subject: ${subject || 'General'}
Identified Weak Topics: ${JSON.stringify(weakTopics)}
High Yield Syllabus Topics: ${JSON.stringify(highYieldTopics)}

CRITICAL REQUIREMENT:
Generate a minute-by-minute survival cram plan whose total duration MUST EXACTLY EQUAL ${duration} MINUTES AND NEVER EXCEED IT.

Structure the blocks chronologically from 0 to ${duration} minutes.
Format of time ranges:
- 0–5 min -> startMin: 0, endMin: 5, durationMin: 5
- 5–12 min -> startMin: 5, endMin: 12, durationMin: 7
...up to exact end of ${duration} min.

Include dedicated allocations for:
- Addressing the student's highest-risk weak topics first
- High-yield formulas or definitions
- A rapid flashcard blitz block (e.g. 5 mins)
- A rapid quiz / mental simulation block (e.g. 5 mins)

Ensure sum of durationMin across all blocks strictly equals ${duration}.
`;

    const contents = [
      {
        text: `Study Material Context:\n${studyContext || 'General curriculum'}\n\nGenerate the emergency ${duration}-minute revision plan now. Strictly respect the time limit.`,
      },
    ];

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: emergencyPlanSchema as any,
        temperature: 0.25,
      },
    });

    const parsed: any = JSON.parse(response.text?.trim() || '{}');

    // Guarantee that total duration matches durationMinutes exactly
    if (parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      let currentMinute = 0;
      for (let i = 0; i < parsed.blocks.length; i++) {
        const b = parsed.blocks[i];
        b.startMin = currentMinute;
        b.endMin = Math.min(currentMinute + (b.durationMin || 5), duration);
        b.durationMin = b.endMin - b.startMin;
        b.timeRange = `${b.startMin}–${b.endMin} min`;
        currentMinute = b.endMin;
        if (currentMinute >= duration) {
          parsed.blocks = parsed.blocks.slice(0, i + 1);
          break;
        }
      }
      if (currentMinute < duration) {
        // Pad the last block to exactly match duration
        const lastBlock = parsed.blocks[parsed.blocks.length - 1];
        lastBlock.endMin = duration;
        lastBlock.durationMin = lastBlock.endMin - lastBlock.startMin;
        lastBlock.timeRange = `${lastBlock.startMin}–${lastBlock.endMin} min`;
      }
      parsed.totalDurationMin = duration;
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('[NoteGen AI] Emergency plan error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate emergency revision plan.' });
  }
});

// API Route: Ask Your Notes Document-Grounded Assistant
app.post('/api/ask-notes', async (req: Request, res: Response) => {
  try {
    const { question, studyContext, fileData, mimeType, history = [] } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are the NoteGen AI Document-Grounded Assistant.
You are embedded inside the student's personal study dashboard.

PRIMARY DIRECTIVE:
You must answer questions strictly and primarily using the student's uploaded study material.

GROUNDING & TRUTH-TELLING RULES:
1. Every answer must be directly supported by, or reasonably deduced from, the provided uploaded study material.
2. IF THE ANSWER CANNOT BE SUPPORTED OR FOUND IN THE UPLOADED MATERIAL:
   You MUST explicitly and clearly state:
   "⚠️ This information was not found in your supplied study material. To ensure your exam preparation stays accurate to your course, I only answer concepts covered in your notes."
   DO NOT invent external facts, make assumptions, or hallucinate citations.
3. EXAMPLES OF HANDLING COMMON PROMPTS:
   - "Explain this in simple terms." -> Give an intuitive mental model using simple metaphors, strictly grounded in their material.
   - "What are the important concepts?" -> List the key definitions and mechanisms directly present in their text.
   - "Give me an example." -> Provide a concrete application directly consistent with the notes.
   - "Quiz me on this chapter." -> Generate 1-2 rapid check-questions directly from the text with answers.
   - "What should I revise first?" -> Guide them based on the core foundations and high-yield concepts in their notes.

Format your responses with clean Markdown: bullet points, bold keywords, and concise paragraphs.
`;

    const contents: any[] = [];

    // First exchange establishes the grounded study document
    const firstUserParts: any[] = [];
    if (fileData) {
      firstUserParts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileData,
        },
      });
      firstUserParts.push({
        text: `Here is the student's uploaded study document. You must ground your answers strictly in this text.`,
      });
    } else {
      firstUserParts.push({
        text: `STUDENT'S UPLOADED STUDY MATERIAL:\n---\n${studyContext || 'No notes context'}\n---`,
      });
    }

    contents.push({ role: 'user', parts: firstUserParts });
    contents.push({
      role: 'model',
      parts: [
        {
          text: 'Understood. I have loaded and indexed your study material and will answer your questions strictly grounded in your notes.',
        },
      ],
    });

    // Add prior conversation history
    if (Array.isArray(history)) {
      history.slice(-6).forEach((h: any) => {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      });
    }

    // Add current user question
    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.json({
      answer: response.text,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[NoteGen AI] Ask notes error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to answer question.' });
  }
});





// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NoteGen AI] Server running at http://localhost:${PORT}`);
});
