import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// VSS endpoint configuration
const VSS_ENDPOINT = process.env.VSS_ENDPOINT || "http://localhost:8100";
const VSS_HELPER_ENDPOINT = process.env.VSS_HELPER_ENDPOINT || "http://localhost:8101";
const VSS_API_KEY = process.env.VSS_API_KEY;

function vssHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (VSS_API_KEY) h["X-API-Key"] = VSS_API_KEY;
  return h;
}

// Step 1: Tell the Crusoe helper server to download the YouTube video locally,
// then register it with VSS using its local filepath (no file transfer to Replit)
async function registerVideoWithVSS(youtubeUrl: string): Promise<string> {
  console.log(`[VSS] Requesting server-side download of: ${youtubeUrl}`);

  const fetchResp = await fetch(`${VSS_HELPER_ENDPOINT}/fetch-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: youtubeUrl }),
    signal: AbortSignal.timeout(600000), // 10 min ceiling for long videos
  });

  if (!fetchResp.ok) {
    const err = await fetchResp.text();
    throw new Error(`Helper server failed to download video: ${err}`);
  }

  const { filepath } = await fetchResp.json();
  console.log(`[VSS] Video available on Crusoe at: ${filepath}`);

  // Register the local filepath with VSS — no binary transfer, just a path reference
  const uploadHeaders: Record<string, string> = {};
  if (VSS_API_KEY) uploadHeaders["X-API-Key"] = VSS_API_KEY;

  const formData = new FormData();
  formData.append("purpose", "vision");
  formData.append("media_type", "video");
  formData.append("filename", filepath); // VSS reads directly from local disk

  const registerResp = await fetch(`${VSS_ENDPOINT}/files`, {
    method: "POST",
    headers: uploadHeaders,
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!registerResp.ok) {
    const err = await registerResp.text();
    throw new Error(`VSS /files registration failed (${registerResp.status}): ${err}`);
  }

  const result = await registerResp.json();
  const fileId = result.id || result.file_id;
  if (!fileId) throw new Error("VSS did not return a file_id after registration.");

  console.log(`[VSS] Registered file_id: ${fileId}`);
  return fileId;
}

// Step 2: Query VSS via /chat/completions to generate exam questions from the video
async function queryVSSForExamContent(
  fileId: string,
  difficulty: string,
  count: number,
  types: any
): Promise<string> {
  const typeList = Array.isArray(types) ? types.join(", ") : String(types);

  const prompt = `
You are an expert exam generator. Watch the video carefully and generate exactly ${count} exam questions.
Difficulty level: ${difficulty}.
Question types to include: ${typeList}.

Return ONLY valid JSON in this exact format with no markdown, no code fences, no explanation outside the JSON:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "A) Option 1",
      "explanation": "Brief explanation of why this is correct."
    },
    {
      "type": "true_false",
      "question": "Statement here.",
      "options": ["True", "False"],
      "answer": "True",
      "explanation": "Explanation here."
    },
    {
      "type": "short_answer",
      "question": "Question here?",
      "answer": "Expected answer.",
      "explanation": "Explanation here."
    }
  ]
}

Only use question types from this list: ${typeList}.
Generate exactly ${count} questions total.
Do not include any text outside the JSON object.
`;

  const chatPayload = {
    model: "via-engine",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    files: [{ file_id: fileId }],
    max_tokens: 4096,
  };

  console.log(`[VSS] Querying /chat/completions for ${count} questions (difficulty: ${difficulty})...`);

  const chatResp = await fetch(`${VSS_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: vssHeaders(),
    body: JSON.stringify(chatPayload),
    signal: AbortSignal.timeout(300000), // 5 min — VLM analysis of long video takes time
  });

  if (!chatResp.ok) {
    const err = await chatResp.text();
    throw new Error(`VSS /chat/completions failed (${chatResp.status}): ${err}`);
  }

  const chatResult = await chatResp.json();

  // VSS returns OpenAI-compatible response shape
  const rawText =
    chatResult?.choices?.[0]?.message?.content ||
    chatResult?.content ||
    "";

  if (!rawText) throw new Error("VSS returned empty content from /chat/completions.");
  return rawText;
}

// Step 3: Parse the raw VSS text response into a structured questions array
function parseQuestionsFromVSSResponse(rawText: string, count: number): any[] {
  // Strip markdown code fences if VSS wraps response in them
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed.questions.slice(0, count);
    }

    throw new Error("Parsed JSON did not contain a valid questions array.");
  } catch (e) {
    console.error("[VSS] Failed to parse response as JSON:", e);
    console.error("[VSS] Raw response preview:", rawText.substring(0, 500));
    throw new Error(
      `VSS response was not valid JSON. Raw output preview: ${rawText.substring(0, 300)}`
    );
  }
}

// Step 4: Clean up the file from VSS after exam is done to avoid storage buildup
async function deleteFileFromVSS(fileId: string): Promise<void> {
  try {
    await fetch(`${VSS_ENDPOINT}/files/${fileId}`, {
      method: "DELETE",
      headers: vssHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[VSS] Cleaned up file_id: ${fileId}`);
  } catch (e) {
    // Non-fatal — log and move on
    console.warn(`[VSS] Could not delete file_id ${fileId}:`, e);
  }
}

// Main orchestrator — called as a background job after exam is created
async function generateExam(
  examId: number,
  url: string,
  format: string,
  difficulty: string,
  count: number,
  types: any
) {
  let fileId: string | null = null;

  try {
    await storage.updateExam(examId, { status: "processing" });

    // 1. Download on Crusoe, register with VSS, get back a file_id
    fileId = await registerVideoWithVSS(url);

    // 2. Ask VSS to analyse the video and return exam questions as JSON
    const rawText = await queryVSSForExamContent(fileId, difficulty, count, types);

    // 3. Parse the JSON response into structured questions
    const questions = parseQuestionsFromVSSResponse(rawText, count);

    // 4. Persist the completed exam
    await storage.updateExam(examId, {
      status: "completed",
      result: { questions },
    });

    console.log(`[XamCent] ✅ Exam ${examId} completed with ${questions.length} questions.`);

  } catch (error) {
    console.error(`[XamCent] ❌ Exam ${examId} generation failed:`, error);
    await storage.updateExam(examId, { status: "failed" });

  } finally {
    // Always clean up the VSS file whether we succeeded or failed
    if (fileId) await deleteFileFromVSS(fileId);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check — tests both VSS and the helper server
  app.get("/api/health", async (req, res) => {
    const results = await Promise.allSettled([
      fetch(`${VSS_ENDPOINT}/health/ready`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${VSS_HELPER_ENDPOINT}/health`, { signal: AbortSignal.timeout(5000) }),
    ]);

    const vssOk = results[0].status === "fulfilled" && results[0].value.ok;
    const helperOk = results[1].status === "fulfilled" && results[1].value.ok;

    const statusCode = vssOk && helperOk ? 200 : 503;

    res.status(statusCode).json({
      status: vssOk && helperOk ? "ok" : "degraded",
      vss: {
        connected: vssOk,
        endpoint: VSS_ENDPOINT,
      },
      helper: {
        connected: helperOk,
        endpoint: VSS_HELPER_ENDPOINT,
      },
    });
  });

  app.get(api.exams.list.path, async (req, res) => {
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  });

  app.post(api.exams.create.path, async (req, res) => {
    try {
      const input = api.exams.create.input.parse(req.body);
      const exam = await storage.createExam(input);

      // Fire-and-forget background job — response returns immediately to the frontend
      generateExam(
        exam.id,
        exam.videoUrl,
        exam.examFormat,
        exam.difficulty,
        exam.questionCount,
        exam.questionTypes
      ).catch(console.error);

      res.status(201).json(exam);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
