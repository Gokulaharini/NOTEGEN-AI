import { jsPDF } from 'jspdf';
import { AnalysisResult } from '../types';

interface PdfExportOptions {
  mode?: 'full' | 'cram';
  filename?: string;
}

export const exportResultToPdf = (data: AnalysisResult, options: PdfExportOptions = {}): void => {
  const isCram = options.mode === 'cram';
  const rawTitle = data.metadata.title || 'Study_Notes';
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = options.filename || (isCram ? `NoteGen_AI_CramSheet_${cleanTitle}.pdf` : `NoteGen_AI_Notes.pdf`);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginX * 2; // 178mm

  let y = marginTop;

  // Colors
  const PRIMARY = [67, 56, 202]; // #4338ca (Indigo-700)
  const ACCENT = [2, 132, 199]; // #0284c7 (Sky-600)
  const TEXT_MAIN = [15, 23, 42]; // #0f172a (Slate-900)
  const TEXT_MUTED = [71, 85, 105]; // #475569 (Slate-600)
  const BORDER_LIGHT = [226, 232, 240]; // #e2e8f0 (Slate-200)
  const BG_CALLOUT = [248, 250, 252]; // #f8fafc (Slate-50)

  // Helper: check space and add new page if needed
  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      return true;
    }
    return false;
  };

  // Helper: draw section banner heading
  const drawSectionHeading = (title: string, iconNumber?: string) => {
    ensureSpace(16);
    y += 4;
    
    // Background accent pill for section number
    if (iconNumber) {
      doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.roundedRect(marginX, y, 7, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(iconNumber, marginX + 3.5, y + 4.8, { align: 'center' });
    }

    const titleX = iconNumber ? marginX + 10 : marginX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(title, titleX, y + 5.2);

    y += 8;
    // Underline divider
    doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 4;
  };

  // Helper: draw callout / highlight card
  const drawCallout = (
    label: string,
    text: string,
    bgColor: number[] = BG_CALLOUT,
    borderColor: number[] = PRIMARY
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const labelLines = label ? [label] : [];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    const textLines = doc.splitTextToSize(text, contentWidth - 10);

    const boxHeight = (labelLines.length ? 5 : 0) + textLines.length * 4.2 + 6;
    ensureSpace(boxHeight + 2);

    // Box background
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 2, 2, 'FD');

    let innerY = y + 4.5;
    if (label) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.text(label.toUpperCase(), marginX + 5, innerY);
      innerY += 4.5;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
    doc.text(textLines, marginX + 5, innerY);

    y += boxHeight + 3;
  };

  // Helper: draw wrapped paragraph
  const drawParagraph = (text: string, fontSize = 9, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    const height = lines.length * (fontSize * 0.42);
    ensureSpace(height + 2);
    doc.text(lines, marginX, y + fontSize * 0.35);
    y += height + 3;
  };

  // --- Document Header ---
  // Top branding bar
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(marginX, y, contentWidth, 2, 'F');
  y += 5;

  // App & Document Subheading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(isCram ? 'NOTEGEN AI • 5-MINUTE EMERGENCY CRAM SHEET' : 'NOTEGEN AI • SMART NOTES & EXAM STRATEGY', marginX, y);
  
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`Generated: ${dateStr}`, marginX + contentWidth, y, { align: 'right' });
  y += 6;

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
  const titleLines = doc.splitTextToSize(data.metadata.title, contentWidth);
  doc.text(titleLines, marginX, y + 3);
  y += titleLines.length * 7 + 2;

  // Metadata pills row
  const subjectText = `Subject: ${data.metadata.subject}`;
  const levelText = `Level: ${data.explanationLevel.toUpperCase()}`;
  const timeText = `Est. Study Time: ${data.metadata.estimatedStudyTime}`;
  const sourcesText = data.sourceInfo?.totalFiles && data.sourceInfo.totalFiles > 1
    ? `  |  Sources: ${data.sourceInfo.totalFiles} Documents`
    : '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`${subjectText}  |  ${levelText}  |  ${timeText}${sourcesText}`, marginX, y);
  y += 4;

  doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 5;

  if (isCram) {
    // ========================================================
    // CRAM SHEET EXPORT MODE
    // ========================================================
    drawSectionHeading('Core Summary & Crux', '1');
    drawParagraph(data.summary.quickSummary, 9.2);

    if (data.summary.keyTakeaway) {
      drawCallout('⚡ Key Takeaway', data.summary.keyTakeaway, [254, 249, 195], [202, 138, 4]);
    }

    drawSectionHeading('Top 10 High-Yield Exam Revision Points', '2');
    data.examRevisionPoints.forEach((p, idx) => {
      const priorityLabel = `[${p.priority}]`;
      const fullText = `${idx + 1}. ${priorityLabel} ${p.point} (${p.category})`;
      drawParagraph(fullText, 8.8, p.priority.toLowerCase().includes('must'));
    });

    drawSectionHeading('Must-Know Terminology & Definitions', '3');
    data.definitions.slice(0, 12).forEach((d) => {
      const defText = `• ${d.term} — ${d.explanation}`;
      drawParagraph(defText, 8.8);
    });

    if (data.hasFormulas && data.formulas.length > 0) {
      drawSectionHeading('High-Yield Formula Sheet', '4');
      data.formulas.forEach((f) => {
        drawCallout(`Formula: ${f.name}`, `${f.formula}\n\nExplanation: ${f.explanation}`, [241, 245, 249], [79, 70, 229]);
      });
    }

    if (data.prioritizationMatrix?.examinerPitfalls?.length > 0) {
      drawSectionHeading('Examiner Traps to Avoid', '5');
      data.prioritizationMatrix.examinerPitfalls.forEach((pitfall) => {
        drawCallout(`⚠️ Exam Trap: ${pitfall.topic}`, `Trap: ${pitfall.trap}\nHow to Avoid: ${pitfall.howToAvoid}`, [255, 241, 242], [225, 29, 72]);
      });
    }
  } else {
    // ========================================================
    // FULL SMART NOTES & EXAM STRATEGY EXPORT MODE
    // ========================================================
    
    // 1. Executive Summary & Core Premises
    drawSectionHeading('Executive Summary & Core Premise', '1');
    drawParagraph(data.summary.quickSummary, 9.2);
    
    if (data.summary.keyTakeaway) {
      drawCallout('Key Takeaway', data.summary.keyTakeaway, [238, 242, 255], PRIMARY);
    }
    if (data.summary.corePremise) {
      drawParagraph(`Core Premise: ${data.summary.corePremise}`, 8.8, true);
    }

    // 2. High-Yield Key Points
    drawSectionHeading('High-Yield Key Points', '2');
    data.keyPoints.forEach((kp, idx) => {
      const pointStr = `${idx + 1}. [${kp.importance}] ${kp.point} (${kp.category})`;
      drawParagraph(pointStr, 8.8);
    });

    // 3. Topic-by-Topic Progressive Notes
    drawSectionHeading('Topic-by-Topic Progressive Notes', '3');
    data.topicNotes.forEach((topic, tIdx) => {
      ensureSpace(24);
      y += 2;

      // Topic title banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(`${tIdx + 1}. ${topic.topicTitle} (Yield: ${topic.examYield})`, marginX, y);
      y += 4.5;

      if (topic.sourceReference) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text(`Reference: ${topic.sourceReference}`, marginX, y);
        y += 4;
      }

      drawParagraph(topic.simpleExplanation, 9);

      if (topic.importantConcepts && topic.importantConcepts.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
        doc.text('Important Concepts:', marginX, y);
        y += 4;
        topic.importantConcepts.forEach((c) => {
          drawParagraph(`  • ${c}`, 8.5);
        });
      }

      if (topic.definitions && topic.definitions.length > 0) {
        topic.definitions.forEach((d) => {
          drawParagraph(`  • Term: ${d.term} — ${d.explanation}`, 8.5);
        });
      }

      if (topic.examples && topic.examples.length > 0) {
        topic.examples.forEach((ex) => {
          drawParagraph(`  • Example: ${ex}`, 8.5);
        });
      }

      if (topic.commonMistake) {
        drawCallout('Common Exam Mistake', topic.commonMistake, [254, 242, 242], [220, 38, 38]);
      }
      y += 3;
    });

    // 4. Important Definitions Glossary
    if (data.definitions && data.definitions.length > 0) {
      drawSectionHeading('High-Yield Definitions & Terminology', '4');
      data.definitions.forEach((d) => {
        ensureSpace(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        doc.text(`• ${d.term}:`, marginX, y);
        
        const termWidth = doc.getTextWidth(`• ${d.term}: `);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
        const explLines = doc.splitTextToSize(d.explanation, contentWidth - termWidth);
        doc.text(explLines, marginX + termWidth, y);
        y += explLines.length * 4.2 + 2;
      });
    }

    // 5. Formulas Reference
    drawSectionHeading('Mathematical & Algorithmic Formulas', '5');
    if (data.hasFormulas && data.formulas && data.formulas.length > 0) {
      data.formulas.forEach((f) => {
        let formulaContent = `Formula: ${f.formula}\n\nExplanation: ${f.explanation}`;
        if (f.variables && f.variables.length > 0) {
          formulaContent += `\nVariables: ${f.variables.join(', ')}`;
        }
        if (f.sourceContext) {
          formulaContent += `\nContext: ${f.sourceContext}`;
        }
        drawCallout(f.name, formulaContent, [241, 245, 249], PRIMARY);
      });
    } else {
      drawParagraph(data.formulasNote || 'No mathematical formulas were found in this source material.', 8.8, false);
    }

    // 6. Top Exam Revision Points
    drawSectionHeading('Top 10 High-Yield Exam Revision Points', '6');
    data.examRevisionPoints.forEach((rp, idx) => {
      const rpText = `${idx + 1}. [${rp.priority}] ${rp.category}: ${rp.point}`;
      drawParagraph(rpText, 8.8, rp.priority.toLowerCase().includes('must'));
    });

    // 7. Exam Strategy & Prioritization Matrix
    drawSectionHeading('Exam Strategy & Prioritization Matrix', '7');
    drawParagraph(data.prioritizationMatrix.focusSummary, 9);

    if (data.prioritizationMatrix.timeAllocationAdvice?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text('Recommended Time Allocation:', marginX, y);
      y += 4.5;
      data.prioritizationMatrix.timeAllocationAdvice.forEach((ta) => {
        drawParagraph(`• ${ta.topic} (${ta.percentage}% of time): ${ta.rationale}`, 8.5);
      });
    }

    if (data.prioritizationMatrix.examinerPitfalls?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text('Examiner Traps to Avoid:', marginX, y);
      y += 4.5;
      data.prioritizationMatrix.examinerPitfalls.forEach((ep) => {
        drawCallout(`Trap: ${ep.topic}`, `${ep.trap}\nSolution: ${ep.howToAvoid}`, [254, 242, 242], [220, 38, 38]);
      });
    }
  }

  // --- Running Footer: Page Numbers & Footer Line ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('NoteGen AI — Adaptive Exam Strategy', marginX, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // Trigger cross-browser clean download
  if (typeof window !== 'undefined') {
    doc.save(filename);
  }
};
