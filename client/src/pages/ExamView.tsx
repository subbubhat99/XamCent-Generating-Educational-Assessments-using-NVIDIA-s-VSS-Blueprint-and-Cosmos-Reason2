import { Layout } from "@/components/Layout";
import { useExam } from "@/hooks/use-exams";
import { useRoute } from "wouter";
import { Loader2, Printer, AlertTriangle, FileCheck, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

// Helper components for rendering different question types beautifully
function QuestionCard({ q, index }: { q: any, index: number }) {
  return (
    <div className="mb-8 print:mb-6 print:break-inside-avoid">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif print:bg-white print:text-black print:border-2 print:border-black">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-lg font-medium text-foreground mb-4 leading-relaxed print:text-black">
            {q.question}
          </p>

          {q.type === 'mcq' && q.options && (
            <div className="space-y-3 mb-4">
              {q.options.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20 print:border-black/20 print:bg-transparent">
                  <div className="w-6 h-6 rounded-md bg-white border border-border flex items-center justify-center text-sm font-semibold print:border-black">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-foreground print:text-black">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {q.type === 'longAnswer' && (
            <div className="h-48 w-full border-2 border-dashed border-border/60 rounded-xl mt-4 print:border-black/30"></div>
          )}
          {q.type === 'shortAnswer' && (
            <div className="h-16 w-full border-b-2 border-dashed border-border/60 mt-4 print:border-black/30"></div>
          )}

          {/* Answer Key (Hidden when printing the exam for students) */}
          <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20 print:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground block mb-1">Answer / Rubric</span>
            <p className="text-sm font-medium text-foreground">{q.answer || "Answers will be provided in the rubric document."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamView() {
  const [, params] = useRoute("/exam/:id");
  const examId = parseInt(params?.id || "0", 10);
  
  const { data: exam, isLoading, error } = useExam(examId);

  if (isLoading || !exam) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Retrieving Data...</h2>
          <p className="text-muted-foreground">Connecting to the server.</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Exam</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </Layout>
    );
  }

  const isProcessing = exam.status === "pending" || exam.status === "processing";
  const isFailed = exam.status === "failed";
  
  // Parse result json if string, or use directly if object
  const resultData = typeof exam.result === 'string' ? JSON.parse(exam.result) : exam.result;
  const questions = resultData?.questions || [];

  return (
    <Layout>
      {isProcessing ? (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="bg-white p-6 rounded-full border border-border shadow-xl relative z-10">
              <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">AI Analysis in Progress</h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            NVIDIA VSS is currently extracting concepts from the video and compiling your {exam.examFormat}-style assessment.
          </p>
          <div className="w-full max-w-md bg-secondary/50 rounded-full h-2 overflow-hidden border border-border">
            <div className="bg-gradient-to-r from-primary/50 via-primary to-primary w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 uppercase tracking-widest font-semibold">Please wait...</p>
        </div>
      ) : isFailed ? (
        <div className="max-w-2xl mx-auto bg-destructive/5 rounded-2xl border border-destructive/20 p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-destructive mb-4">Generation Failed</h2>
          <p className="text-muted-foreground">The AI was unable to process the provided video URL. Please ensure the link is publicly accessible and contains spoken content.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Action Bar (Hidden in Print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-border/50 print:hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-3">
                <FileCheck className="w-3 h-3" />
                Generation Complete
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground">{exam.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="font-semibold">{exam.examFormat} Format</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>{exam.difficulty} Level</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>{questions.length} Questions</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold hover-elevate hover:shadow-xl"
            >
              <Printer className="w-5 h-5" />
              Print Paper
            </button>
          </div>

          {/* Exam Paper Document View */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-none sm:rounded-2xl p-4 sm:p-12 sm:border sm:border-border sm:shadow-2xl sm:shadow-black/5 print:p-0 print:border-none print:shadow-none print:bg-transparent"
          >
            {/* Paper Header for Print/Visual */}
            <div className="mb-12 border-b-2 border-foreground/20 pb-8 print:border-black">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-foreground print:text-black mb-2">{exam.title}</h1>
                  <h2 className="text-lg text-muted-foreground print:text-black/70 font-serif italic">
                    Official {exam.examFormat} Practice Examination
                  </h2>
                </div>
                <div className="text-right text-sm text-foreground font-medium print:text-black">
                  <p>Difficulty: {exam.difficulty}</p>
                  <p>Total Questions: {questions.length}</p>
                </div>
              </div>
              
              {/* Student Details Block (Only really visible/useful in print) */}
              <div className="mt-8 grid grid-cols-2 gap-8 print:grid-cols-2">
                <div className="border-b border-dashed border-foreground/40 print:border-black pb-1">
                  <span className="text-sm font-semibold text-muted-foreground print:text-black/60">Candidate Name:</span>
                </div>
                <div className="border-b border-dashed border-foreground/40 print:border-black pb-1">
                  <span className="text-sm font-semibold text-muted-foreground print:text-black/60">Date:</span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2">
              {questions.length > 0 ? (
                questions.map((q: any, i: number) => (
                  <QuestionCard key={i} q={q} index={i} />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No questions were found in the generated result.
                </div>
              )}
            </div>
            
            {/* End of paper marker */}
            <div className="mt-16 text-center text-sm font-bold tracking-widest text-muted-foreground uppercase print:text-black/50">
              --- End of Examination ---
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
