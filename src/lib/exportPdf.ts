import jsPDF from "jspdf";
import { getUserName } from "@/lib/userPrefs";
import { getStats, getQuizzes, getDecks } from "@/lib/store";
import { getSummaries } from "@/lib/summaryStore";

const MODE_LABELS: Record<string, string> = { tldr: "TL;DR", deep: "Deep Dive", feynman: "Feynman" };

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 255) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);
  y += 2;
  doc.setDrawColor(100);
  doc.line(14, y, 196, y);
  return y + 8;
}

export async function generateExportPdf() {
  const doc = new jsPDF();
  const pw = 182; // printable width
  let y = 20;

  // ── Title ──
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("StudySprint — My Data Export", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, y);
  y += 14;

  // ── Section 1: Profile ──
  const name = getUserName() || "User";
  const joinDate = localStorage.getItem("studysprint_joinDate") || "—";
  const stats = getStats();
  y = sectionTitle(doc, "1. Profile Summary", y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const profileLines = [
    `Name: ${name}`,
    `Member since: ${joinDate}`,
    `Total sessions: ${stats.totalSessions}`,
    `Current streak: ${stats.streak} days (best: ${stats.bestStreak})`,
    `Quizzes taken: ${stats.totalQuizzesTaken}`,
    `Cards mastered: ${stats.cardsMastered}`,
  ];
  for (const l of profileLines) { doc.text(l, 14, y); y += 6; }
  y += 6;

  // ── Section 2: Summaries ──
  y = sectionTitle(doc, "2. Saved Summaries", y);
  const summaries = getSummaries();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (summaries.length === 0) {
    doc.text("No summaries saved yet.", 14, y);
    y += 10;
  } else {
    for (const s of summaries) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${s.subject} — ${MODE_LABELS[s.mode] || s.mode}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Date: ${new Date(s.dateCreated).toLocaleDateString()}`, 14, y);
      y += 5;
      doc.setFontSize(9);
      y = addWrappedText(doc, s.content || "(empty)", 14, y, pw, 4.5);
      y += 6;
      doc.setFontSize(10);
    }
  }

  // ── Section 3: Quizzes ──
  y = sectionTitle(doc, "3. Saved Quizzes", y);
  const quizzes = getQuizzes();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (quizzes.length === 0) {
    doc.text("No quizzes saved yet.", 14, y);
    y += 10;
  } else {
    for (const q of quizzes) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${q.title}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Date: ${new Date(q.createdAt).toLocaleDateString()} | Score: ${q.score != null ? q.score + "%" : "N/A"} | Questions: ${q.questions}`, 14, y);
      y += 5;

      // load individual questions
      try {
        const raw = localStorage.getItem(`studysprint_quiz_data_${q.id}`);
        if (raw) {
          const questions = JSON.parse(raw) as { question: string; correct_answer?: string; correctAnswer?: string }[];
          doc.setFontSize(9);
          for (const qn of questions) {
            if (y > 270) { doc.addPage(); y = 20; }
            y = addWrappedText(doc, `Q: ${qn.question}`, 18, y, pw - 4, 4.5);
            const ans = qn.correct_answer || qn.correctAnswer || "—";
            y = addWrappedText(doc, `A: ${ans}`, 18, y, pw - 4, 4.5);
            y += 2;
          }
        }
      } catch { /* skip */ }
      y += 4;
      doc.setFontSize(10);
    }
  }

  // ── Section 4: Flashcard Decks ──
  y = sectionTitle(doc, "4. Flashcard Decks", y);
  const decks = getDecks();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (decks.length === 0) {
    doc.text("No flashcards saved yet.", 14, y);
    y += 10;
  } else {
    for (const d of decks) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${d.title} (${d.subject})`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Date: ${new Date(d.createdAt).toLocaleDateString()} | Cards: ${d.cards} | Mastered: ${d.mastered}`, 14, y);
      y += 5;

      try {
        const raw = localStorage.getItem(`studysprint_deck_data_${d.id}`);
        if (raw) {
          const cards = JSON.parse(raw) as { front: string; back: string }[];
          doc.setFontSize(9);
          for (const c of cards) {
            if (y > 270) { doc.addPage(); y = 20; }
            y = addWrappedText(doc, `Front: ${c.front}`, 18, y, pw - 4, 4.5);
            y = addWrappedText(doc, `Back: ${c.back}`, 18, y, pw - 4, 4.5);
            y += 2;
          }
        }
      } catch { /* skip */ }
      y += 4;
      doc.setFontSize(10);
    }
  }

  doc.save("StudySprint_Export.pdf");
}
