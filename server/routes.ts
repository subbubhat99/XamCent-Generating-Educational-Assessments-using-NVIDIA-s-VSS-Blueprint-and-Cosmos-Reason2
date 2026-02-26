import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Remove OpenAI import - no longer needed
// const openai = new OpenAI({...});

// VSS endpoint configuration
const VSS_ENDPOINT = process.env.VSS_ENDPOINT || "http://localhost:9100";

async function generateExam(
  examId: number, 
  url: string, 
  format: string, 
  difficulty: string, 
  count: number, 
  types: any
) {
  try {
    await storage.updateExam(examId, { status: "processing" });

    // Call VSS blueprint instead of OpenAI
    const vssPayload = {
      video_url: url,
      num_questions: count,
      difficulty: difficulty,
      exam_format: format,
      question_types: types
    };

    console.log("Calling VSS with payload:", vssPayload);

    const response = await fetch(`${VSS_ENDPOINT}/api/generate-exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vssPayload),
      signal: AbortSignal.timeout(120000) // 2 minute timeout for video processing
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VSS API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // VSS should return format: { questions: [...] }
    // If format is different, adjust here
    const formattedResult = {
      questions: result.questions || result.data?.questions || []
    };

    await storage.updateExam(examId, { 
      status: "completed", 
      result: formattedResult 
    });

    console.log(`Exam ${examId} completed successfully`);

  } catch (error) {
    console.error("Exam generation failed:", error);
    await storage.updateExam(examId, { 
      status: "failed"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoint to test VSS connection
  app.get("/api/health", async (req, res) => {
    try {
      const vssHealth = await fetch(`${VSS_ENDPOINT}/health`, {
        signal: AbortSignal.timeout(5000)
      });

      res.json({
        status: "ok",
        vss_connected: vssHealth.ok,
        vss_endpoint: VSS_ENDPOINT
      });
    } catch (error) {
      res.status(503).json({
        status: "degraded",
        vss_connected: false,
        vss_endpoint: VSS_ENDPOINT,
        error: error instanceof Error ? error.message : "Cannot reach VSS"
      });
    }
  });

  app.get(api.exams.list.path, async (req, res) => {
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.json(exam);
  });

  app.post(api.exams.create.path, async (req, res) => {
    try {
      const input = api.exams.create.input.parse(req.body);
      const exam = await storage.createExam(input);

      // Kick off background job for generation via VSS
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
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}