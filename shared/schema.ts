import { pgTable, serial, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  examFormat: text("exam_format").notNull(),
  difficulty: text("difficulty").notNull(),
  questionCount: integer("question_count").notNull(),
  questionTypes: json("question_types").notNull(), // { mcq: number, shortAnswer: number, etc }
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  result: json("result"), // The generated exam content
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  status: true,
  result: true,
  createdAt: true,
});

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type CreateExamRequest = InsertExam;
export type UpdateExamStatusRequest = Partial<Pick<Exam, "status" | "result">>;

export type ExamResponse = Exam;
