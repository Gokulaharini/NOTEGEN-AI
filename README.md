# 📚 NoteGen AI

### Turn your study material into your personal exam strategy.

**NoteGen AI** is an AI-powered smart study assistant that transforms lengthy study materials into concise revision notes, key concepts, flashcards, quizzes, weakness analysis, and personalized exam revision plans.

Instead of simply summarizing a document, NoteGen AI creates an **adaptive exam-preparation journey** based on what a student needs to learn, practice, improve, and revise.

---

## 🚀 Problem Statement

Students spend a significant amount of time converting lengthy PDFs, lecture notes, and study materials into useful revision content.

Traditional study workflows require students to:

- Read lengthy study materials
- Identify important concepts manually
- Prepare their own notes
- Create flashcards
- Search for important questions
- Test themselves
- Identify weak topics
- Decide what to revise first
- Create a study timetable

This process is time-consuming and often inefficient, especially when exams are approaching.

### 💡 Our Solution

**NoteGen AI automates this entire workflow.**

```text
Study Material
      ↓
Smart Notes
      ↓
Key Concepts
      ↓
Flashcards + Quiz
      ↓
Performance Analysis
      ↓
Weak Topic Detection
      ↓
Targeted Revision
      ↓
Exam Prioritization
      ↓
Time-Constrained Revision Plan
```

---

# ✨ Key Features

## 📝 1. Smart Notes Generator

Upload your study material and generate structured notes automatically.

### Provides:

- Quick Summary
- Core Concepts
- Key Takeaways
- Topic-wise Notes
- Important Definitions
- Keywords
- Formula Extraction
- High-Yield Exam Points
- Different explanation levels

### Explanation Modes

- 🟢 Beginner
- 🔵 Standard
- 🔴 Exam Ready

This allows students to understand the same topic at different levels of depth.

---

## 🧠 2. AI Deep Dive

Students can explore difficult concepts without leaving their notes.

The AI can provide:

- Simple explanations
- Detailed explanations
- Examples
- Concept breakdowns
- Important points for exams

This helps students move from **understanding → revision → exam preparation**.

---

# 🃏 3. AI Flashcards

NoteGen AI converts important concepts from study material into active-recall flashcards.

### Flashcards support:

- Question and answer format
- Interactive card flipping
- Previous / Next navigation
- Shuffle
- Card count
- "I Know"
- "Need Revision"
- Mastery tracking

### Learning Flow

```text
Study Material
      ↓
Important Concepts
      ↓
AI Flashcards
      ↓
Active Recall
      ↓
Mastery Tracking
      ↓
Need Revision
```

Flashcard performance can contribute to identifying topics that need additional revision.

---

# 🎯 4. AI Quiz & Practice Arena

Students can test their understanding using AI-generated quizzes.

The quiz provides:

- Multiple-choice questions
- Difficulty indicators
- Answer validation
- Explanations
- Score calculation
- Topic-wise performance
- Correct / Incorrect analysis

### Example

```text
Question
   ↓
Student Answer
   ↓
Automatic Scoring
   ↓
Performance Analysis
   ↓
Topic Classification
```

---

# 📊 5. Weak Topic Analyzer

One of the core features of NoteGen AI is identifying topics that require more attention.

The system analyzes quiz performance and categorizes topics as:

- 🟢 Strong
- 🟡 Moderate
- 🔴 Weak

For weak topics, NoteGen AI provides:

- Concept breakdown
- Important points
- Common examiner traps
- Targeted revision
- Recovery mini-quiz

### Adaptive Learning Loop

```text
Learn
  ↓
Practice
  ↓
Analyze
  ↓
Find Weakness
  ↓
Revise
  ↓
Test Again
```

---

# 📅 6. Exam Intelligence

Students can provide information such as:

- Subject
- Exam date
- Available study hours
- Confidence level
- Syllabus weightage

The system uses these factors along with learning performance to prioritize topics.

### Priority Levels

| Priority | Meaning |
|---|---|
| 🔴 High | Needs immediate attention |
| 🟡 Medium | Requires regular revision |
| 🟢 Low | Already relatively strong |

This helps students focus on **what matters most before the exam**.

---

# ⏱️ 7. "I Have Only 30 Minutes"

When students have very limited time, NoteGen AI can generate a focused revision plan.

Available time options include:

- 10 minutes
- 20 minutes
- 30 minutes
- 1 hour
- 2 hours

The system creates a minute-by-minute revision schedule.

### Example

```text
30 Minutes Available

10 min → Weak Topic 1
 8 min → Important Formulas
 7 min → High-Yield Concepts
 5 min → Quick Quiz
```

The planner respects the **hard time constraint** instead of generating an unrealistic study schedule.

---

# 💬 8. Ask Your Notes

Students can ask questions about their uploaded study material.

Examples:

> Explain this topic in simple words.

> What are the important points for the exam?

> Give me a real-world example.

> Which concepts should I revise first?

The system is designed to keep answers grounded in the uploaded study material and avoid presenting unsupported information as if it came from the document.

---

# ⚡ 9. 5-Minute Cram Sheet

For last-minute revision, NoteGen AI generates a compact revision sheet containing:

- Important concepts
- Key definitions
- Formulas
- High-yield points
- Important keywords

The cram sheet is designed for quick revision immediately before an exam.

---

# 📄 10. Export & Download

Students can export their generated study content for offline revision.

Supported workflows include:

- Print / PDF
- Markdown download
- Clipboard copy

---

# 🧩 What Makes NoteGen AI Different?

AI-powered study tools already provide features such as summarization, question generation, flashcards, and document-based conversations.

NoteGen AI focuses on **connecting these capabilities into one exam-oriented adaptive workflow**.

### Our Core Innovation

> **We don't stop at generating notes. We use learning performance to decide what the student should study next.**

```text
Material
   ↓
Notes
   ↓
Practice
   ↓
Performance
   ↓
Weakness Detection
   ↓
Targeted Revision
   ↓
Exam Priority
   ↓
Personalized Study Plan
```

This creates a continuous feedback loop between **learning and performance**.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────┐
│          Student             │
│                              │
│  Upload PDF / Study Material │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      React + TypeScript      │
│         Frontend             │
│                              │
│ Notes | Quiz | Flashcards    │
│ Analysis | Planner | Q&A     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Node.js + Express       │
│        Backend/API           │
│                              │
│ Secure AI Request Handling   │
│ Structured Response Handling │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Generative AI          │
│                              │
│ Document Understanding       │
│ Content Generation           │
│ Quiz Generation              │
│ Flashcard Generation         │
│ Q&A                          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Application Logic        │
│                              │
│ Quiz Scoring                 │
│ Topic Analysis               │
│ Priority Calculation         │
│ Time Allocation              │
│ Mastery Tracking             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│    Personalized Dashboard   │
│                              │
│ Smart Notes                  │
│ Weak Topics                  │
│ Revision Plan                │
│ Exam Strategy                │
└──────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Responsive UI
- Modern CSS / utility-based styling

## Backend

- Node.js
- Express.js
- REST API

## AI

- Generative AI
- Large Language Model (LLM)
- AI-powered document understanding
- Structured AI generation

## Browser Technologies

- LocalStorage
- Web Speech API
- Browser Print / PDF workflow

---

# 🤖 AI & Application Logic

NoteGen AI combines generative AI with deterministic application logic.

### Generative AI handles:

- Document understanding
- Note generation
- Concept extraction
- Quiz generation
- Flashcard generation
- Explanations
- Document-grounded question answering
- Revision content generation

### Application logic handles:

- Quiz scoring
- Topic-wise accuracy
- Strong / Moderate / Weak classification
- Priority calculation
- Study-time allocation
- Flashcard mastery tracking
- Revision scheduling

### Key Principle

> **AI provides intelligence; the application provides learning logic.**

---

# 🧮 Adaptive Prioritization

The system considers multiple factors when determining what students should focus on.

Conceptually:

```text
Topic Priority
      =
Learning Performance
+ Exam Urgency
+ Syllabus Importance
+ Student Confidence
+ Available Study Time
```

This allows the system to move beyond simple document summarization toward **performance-based personalization**.

---

# 🔄 Complete Learning Workflow

```text
          ┌──────────────┐
          │ Study Material│
          └───────┬──────┘
                  ↓
          ┌──────────────┐
          │ Smart Notes  │
          └───────┬──────┘
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   Flashcards             Quiz
        ↓                   ↓
        └─────────┬─────────┘
                  ↓
         Performance Analysis
                  ↓
          Weak Topic Detection
                  ↓
          Targeted Remediation
                  ↓
           Exam Prioritization
                  ↓
          Personalized Revision
                  ↓
             Re-Test
                  ↓
             Improvement
```

---

# 🔐 Security

The application follows a server-side API architecture.

- API credentials are kept on the server.
- Sensitive API keys are not exposed in the client-side application.
- AI requests are routed through the backend.
- Uploaded material is processed for generating study content.

> Users should avoid uploading confidential or sensitive documents unless the deployment environment is configured appropriately for their privacy requirements.

---

# 📦 Installation

## Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- A Generative AI API key

---

## 1. Clone the repository

```bash
git clone https://github.com/Gokulaharini/NOTEGEN-AI.git
```

Navigate into the project:

```bash
cd NOTEGEN-AI
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file in the project root.

```env
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

### Important

Never commit your actual API key to GitHub.

Use `.env.example` as a reference.

---

# ▶️ Running the Project

## Development

```bash
npm run dev
```

The application will start in development mode.

---

## Build

```bash
npm run build
```

---

## Lint

```bash
npm run lint
```

---

## Production

```bash
npm start
```

---

# 🧪 Testing the Application

Recommended demo workflow:

### Step 1
Upload a study PDF.

### Step 2
Generate Smart Notes.

### Step 3
Explore:

- Summary
- Key Takeaways
- Definitions
- Formulas
- High-Yield Points

### Step 4
Generate flashcards.

### Step 5
Practice the AI quiz.

### Step 6
Review the performance analysis.

### Step 7
Open Weak Topic Analyzer.

### Step 8
Use targeted remediation.

### Step 9
Enter exam details in Exam Intelligence.

### Step 10
Try:

> **"I Have Only 30 Minutes"**

### Step 11
Use the Cram Sheet for final revision.

---

# 🎓 Example Use Case

Imagine a student has a **100-page Computer Networks PDF**.

Instead of spending hours manually preparing revision material:

```text
100-page PDF
     ↓
Smart Notes
     ↓
Important Concepts
     ↓
Flashcards
     ↓
Practice Quiz
     ↓
80% Overall Score
     ↓
Weak Topic: Transport Layer
     ↓
Targeted Explanation
     ↓
Recovery Quiz
     ↓
Exam Priority
     ↓
30-Minute Revision Plan
```

The student gets a personalized path from **content → understanding → practice → improvement → revision**.

---

# 🌟 Benefits

## For Students

- Saves preparation time
- Reduces manual note-making
- Improves active recall
- Identifies weak areas
- Supports last-minute revision
- Creates personalized study priorities

## For Educators

Potentially useful for:

- Revision material generation
- Practice question generation
- Topic analysis
- Personalized learning support

---

# 🚀 Future Enhancements

Potential future improvements include:

- User authentication
- Cloud-based student profiles
- Cross-device synchronization
- Persistent learning history
- More advanced retrieval pipelines
- LMS integration
- Multi-language support
- Voice-based study assistant
- Learning analytics dashboard
- Teacher dashboard
- Question-paper pattern analysis
- Previous-year-question integration
- More advanced spaced-repetition scheduling

---

# ⚠️ Current Limitations

The current MVP has some practical limitations:

- Large PDFs may require additional processing optimization.
- AI-generated educational content should be academically verified.
- Browser-based storage is limited compared with a full cloud database.
- Voice functionality depends on browser support.
- The current MVP focuses primarily on document-based learning material.
- Advanced user authentication and cloud synchronization are future enhancements.

---

# 🎯 Project USP

### Traditional Study Workflow

```text
Read → Make Notes → Search Questions → Practice → Plan Revision
```

### NoteGen AI

```text
Upload
   ↓
Understand
   ↓
Generate Notes
   ↓
Practice
   ↓
Analyze
   ↓
Detect Weakness
   ↓
Prioritize
   ↓
Revise
   ↓
Improve
```

### One-line USP

> **NoteGen AI transforms static study material into an adaptive, exam-oriented learning journey.**

---

# 🏆 Hackathon Pitch

> **"Students don't need another summarizer. They need to know what to study, what they don't know, and what to revise next."**

NoteGen AI converts study materials into smart notes, quizzes, flashcards, weakness analysis, and personalized revision strategies — helping students move from **passive reading to active, performance-driven preparation**.

---

# 👥 Team

## TEAM SPIRIT

| Member | Role |
|---|---|
| M D Gokula Harini | Team Member |
| Sankari R | Team Member |
| Sanjushree K S | Team Member |
| Ethikhasan S | Team Member |

---

# 📌 Project Information

**Project:** NoteGen AI  
**Domain:** Education & Learning  
**Category:** Generative AI / Adaptive Learning  
**Problem Statement:** Smart Notes Generator  
**Team:** TEAM SPIRIT

### Tagline

> **Turn your study material into your personal exam strategy.**

---

# 📜 License

This project is developed as a hackathon project.

License and deployment permissions can be updated according to the team's requirements.

---

# ⭐ Support

If you find the project useful, consider giving the repository a ⭐ on GitHub.

---

## Made by TEAM SPIRIT

**NoteGen AI — Learn smarter. Practice better. Revise strategically.**
