import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function generateExam(examId: number, url: string, format: string, difficulty: string, count: number, types: any) {
  try {
    await storage.updateExam(examId, { status: "processing" });
    
    // Simulate NVIDIA VSS by generating questions based on the parameters
    const prompt = `You are an expert exam setter. Generate an exam paper based on the following configuration.
Video URL/Topic: ${url}
Format: ${format}
Difficulty: ${difficulty}
Total Questions: ${count}
Question Types Breakdown: ${JSON.stringify(types)}

Output MUST be a valid JSON object with a single "questions" array.
Each question should be an object:
- type: string ("mcq", "short-answer", "long-answer")
- question: string
- options: array of strings (ONLY if type is "mcq")
- answer: string (the correct answer or a sample good answer)`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"questions": []}');
    
    await storage.updateExam(examId, { status: "completed", result });
  } catch (error) {
    console.error("Exam generation failed:", error);
    await storage.updateExam(examId, { status: "failed" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      
      // Kick off background job for generation
      generateExam(exam.id, exam.videoUrl, exam.examFormat, exam.difficulty, exam.questionCount, exam.questionTypes).catch(console.error);
      
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
