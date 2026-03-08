import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Prompts ──────────────────────────────────────

const SUMMARY_PROMPTS: Record<string, string> = {
  tldr: `You are an expert study assistant. The user will give you a piece of text, notes, or a topic.

Your job is to produce a TL;DR summary.

Rules:
- Return EXACTLY 5 bullet points. No more, no less.
- Each bullet must start with a bold keyword or concept, followed by a colon, then 1 clean sentence.
- Maximum 20 words per bullet.
- Use simple, direct language. No fluff.
- Do NOT include an intro sentence or conclusion. Just the 5 bullets.
- Format: • **Keyword**: explanation sentence.`,

  deepDive: `You are an expert study assistant and educator. The user will give you text, notes, or a topic.

Your job is to produce a structured Deep Dive summary.

Rules:
- Break the content into 3-5 clear sections with short H3-style headings.
- Under each heading, write 2-4 sentences explaining that concept clearly.
- Bold any key terms or important vocabulary inline.
- At the end, add a "Key Takeaways" section with 3 bullet points.
- Keep the total length under 400 words.
- Use clear academic but approachable language.`,

  feynman: `You are a brilliant teacher who can explain anything simply. The user will give you text, notes, or a topic.

Your job is to explain it in Feynman style — as if teaching a curious 12-year-old.

Rules:
- Start with: "Imagine..." and use a real-world analogy in the first sentence.
- Never use jargon without immediately explaining it in plain words.
- Use short paragraphs (2-3 sentences max each).
- Include at least 1 analogy or comparison to everyday life.
- End with: "The big idea here is..." followed by one simple sentence that captures the core concept.
- Keep it under 250 words. Conversational, warm, and engaging.`,
};

const DETECT_SUBJECT_PROMPT = `You are a subject classifier. The user will paste text or a topic.

Identify the academic subject it belongs to.

Return ONLY a JSON object like this, no extra text:
{
  "subject": "Biology",
  "emoji": "🧬",
  "confidence": "high"
}

Choose subject from: Math, Science, Biology, Chemistry, Physics, History, Geography,
Computer Science, Literature, Languages, Law, Economics, Art, Music, Philosophy, Psychology, Other.

Confidence is "high", "medium", or "low".`;

function quizPrompt(difficulty: string, questionCount: number) {
  return `You are an expert quiz generator. The user will give you text, notes, or a topic.

Generate a quiz with exactly ${questionCount} multiple choice questions at ${difficulty} difficulty.

Rules:
- Each question must test genuine understanding, not just memorization of words.
- Beginner: tests basic definitions and facts.
- Intermediate: tests application and relationships between concepts.
- Advanced: tests analysis, edge cases, and deeper reasoning.
- Each question has exactly 4 answer options labeled A, B, C, D.
- Only ONE option is correct.
- Distractors (wrong answers) must be plausible — not obviously wrong.
- After each question include a short explanation (1-2 sentences) for why the correct answer is right.

Return ONLY valid JSON in this exact format, no extra text:
{
  "quiz": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct": "A",
      "explanation": "Brief explanation of why A is correct."
    }
  ]
}`;
}

function flashcardPrompt(cardCount: number) {
  return `You are an expert flashcard creator trained in spaced repetition learning.
The user will give you text, notes, or a topic.

Generate exactly ${cardCount} flashcards that cover the most important concepts.

Rules:
- Front of card: a clear, specific question or term. Never vague.
- Back of card: a concise answer. Maximum 2 sentences.
- Cover a MIX of: key terms, important facts, cause-and-effect relationships, and concept definitions.
- Do NOT create cards that are too similar to each other.
- Order cards from foundational concepts → advanced concepts.
- Keep language clear and precise.

Return ONLY valid JSON in this exact format, no extra text:
{
  "flashcards": [
    {
      "id": 1,
      "front": "What is [term/question]?",
      "back": "Concise answer here. Max 2 sentences.",
      "tag": "definition"
    }
  ]
}

For the "tag" field use one of: "definition", "concept", "fact", "process", "cause-effect"`;
}

// ── AI call helper ───────────────────────────────

async function callAI(systemPrompt: string, userContent: string, apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    console.error("AI gateway error:", status, text);
    if (status === 429) throw new Error("RATE_LIMITED");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI_ERROR_${status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main handler ─────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, difficulty, questionCount, cardCount, summaryStyle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let result: string;

    switch (type) {
      case "detect-subject":
        result = await callAI(DETECT_SUBJECT_PROMPT, content, LOVABLE_API_KEY);
        break;

      case "summary":
        const style = summaryStyle || "tldr";
        const prompt = SUMMARY_PROMPTS[style] || SUMMARY_PROMPTS.tldr;
        result = await callAI(prompt, content, LOVABLE_API_KEY);
        break;

      case "quiz":
        result = await callAI(
          quizPrompt(difficulty || "Intermediate", questionCount || 10),
          content,
          LOVABLE_API_KEY
        );
        break;

      case "flashcards":
        result = await callAI(
          flashcardPrompt(cardCount || 20),
          content,
          LOVABLE_API_KEY
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid type. Use: detect-subject, summary, quiz, flashcards" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("study-ai error:", e);

    const message = e instanceof Error ? e.message : "Unknown error";
    let status = 500;
    if (message === "RATE_LIMITED") status = 429;
    if (message === "PAYMENT_REQUIRED") status = 402;

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
