import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ExamResponse } from "@shared/routes";
import { z } from "zod";

// Helper to log and parse
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useExams() {
  return useQuery({
    queryKey: [api.exams.list.path],
    queryFn: async () => {
      const res = await fetch(api.exams.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      return parseWithLogging(api.exams.list.responses[200], data, "exams.list");
    },
  });
}

export function useExam(id: number) {
  return useQuery({
    queryKey: [api.exams.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.exams.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch exam");
      const data = await res.json();
      return parseWithLogging(api.exams.get.responses[200], data, "exams.get");
    },
    // Poll every 2 seconds if status is pending or processing
    refetchInterval: (query) => {
      const data = query.state.data as ExamResponse | undefined | null;
      if (data && (data.status === "pending" || data.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });
}

// We define a more forgiving input type that the form uses, which coerces to the exact schema
export const createExamFormSchema = z.object({
  title: z.string().min(3, "Title is required"),
  videoUrl: z.string().url("Must be a valid URL"),
  examFormat: z.string().min(1, "Format is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  questionTypes: z.object({
    mcq: z.coerce.number().min(0).default(0),
    shortAnswer: z.coerce.number().min(0).default(0),
    longAnswer: z.coerce.number().min(0).default(0),
  }).refine(data => data.mcq + data.shortAnswer + data.longAnswer > 0, {
    message: "Must select at least one question type",
  }),
});

export type CreateExamFormValues = z.infer<typeof createExamFormSchema>;

export function useCreateExam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (values: CreateExamFormValues) => {
      // Calculate total question count
      const questionCount = values.questionTypes.mcq + values.questionTypes.shortAnswer + values.questionTypes.longAnswer;
      
      const payload = {
        ...values,
        questionCount,
      };

      const validated = api.exams.create.input.parse(payload);
      
      const res = await fetch(api.exams.create.path, {
        method: api.exams.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Validation failed");
        }
        throw new Error("Failed to create exam");
      }
      
      const data = await res.json();
      return parseWithLogging(api.exams.create.responses[201], data, "exams.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exams.list.path] });
    },
  });
}
