import { z } from "zod";
import { insertExamSchema, exams } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  exams: {
    list: {
      method: "GET" as const,
      path: "/api/exams" as const,
      responses: {
        200: z.array(z.custom<typeof exams.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/exams/:id" as const,
      responses: {
        200: z.custom<typeof exams.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/exams" as const,
      input: insertExamSchema,
      responses: {
        201: z.custom<typeof exams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ExamInput = z.infer<typeof api.exams.create.input>;
export type ExamResponse = z.infer<typeof api.exams.create.responses[201]>;
