import { db } from "./db";
import { exams, type Exam, type InsertExam } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, updates: Partial<Exam>): Promise<Exam | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(insertExam).returning();
    return exam;
  }

  async updateExam(id: number, updates: Partial<Exam>): Promise<Exam | undefined> {
    const [exam] = await db
      .update(exams)
      .set(updates)
      .where(eq(exams.id, id))
      .returning();
    return exam;
  }
}

export const storage = new DatabaseStorage();
