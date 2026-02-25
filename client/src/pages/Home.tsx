import { Layout } from "@/components/Layout";
import { useCreateExam, createExamFormSchema, type CreateExamFormValues } from "@/hooks/use-exams";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Loader2, Video, GraduationCap, BrainCircuit, FileSignature, Layers } from "lucide-react";
import { motion } from "framer-motion";

const EXAM_FORMATS = ["SAT", "GRE", "GMAT", "JEE", "Gao-Kao", "GCSE A-Levels", "Custom"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function Home() {
  const [, setLocation] = useLocation();
  const createExam = useCreateExam();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<CreateExamFormValues>({
    resolver: zodResolver(createExamFormSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      examFormat: "SAT",
      difficulty: "Intermediate",
      questionTypes: {
        mcq: 10,
        shortAnswer: 5,
        longAnswer: 2,
      }
    }
  });

  const mcq = watch("questionTypes.mcq");
  const short = watch("questionTypes.shortAnswer");
  const long = watch("questionTypes.longAnswer");
  const total = (Number(mcq) || 0) + (Number(short) || 0) + (Number(long) || 0);

  const onSubmit = async (data: CreateExamFormValues) => {
    try {
      const exam = await createExam.mutateAsync(data);
      setLocation(`/exam/${exam.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Hero / Info Section */}
        <div className="lg:col-span-5 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-semibold mb-6 border border-accent/20">
            <BrainCircuit className="w-4 h-4 text-accent" />
            NVIDIA VSS Powered
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary leading-tight mb-6">
            Transform video <br/> into challenging <br/> <span className="text-accent italic">assessments.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Enter any tutorial or lecture video URL up to 24 hours in length. XamCent analyzes the content and generates production-ready question papers adhering to global standards.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary"><Video className="w-5 h-5"/></div>
              <div>
                <h3 className="font-semibold text-foreground">Deep Video Analysis</h3>
                <p className="text-sm text-muted-foreground">Summarizes and extracts core concepts across any discipline.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary"><FileSignature className="w-5 h-5"/></div>
              <div>
                <h3 className="font-semibold text-foreground">Global Formats</h3>
                <p className="text-sm text-muted-foreground">Styles questions natively for SAT, GRE, JEE, and more.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-7">
          <motion.div 
            className="bg-card rounded-3xl p-8 shadow-2xl shadow-primary/5 border border-border/50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="mb-8 border-b border-border pb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground">Exam Configuration</h2>
              <p className="text-sm text-muted-foreground mt-1">Set the parameters for your generated assessment.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Exam Title</label>
                  <input 
                    {...register("title")}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. Advanced Calculus Midterm"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Source Video URL (.mp4 or supported link)</label>
                  <input 
                    {...register("videoUrl")}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="https://example.com/lecture.mp4"
                  />
                  {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Exam Format</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select 
                      {...register("examFormat")}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {EXAM_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  {errors.examFormat && <p className="text-red-500 text-sm mt-1">{errors.examFormat.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Difficulty</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select 
                      {...register("difficulty")}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>}
                </div>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-secondary">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-foreground">Question Distribution</label>
                  <div className="text-sm font-medium px-3 py-1 rounded-full bg-white text-primary shadow-sm border border-border">
                    Total: {total}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Multiple Choice</label>
                    <input 
                      type="number" 
                      min="0"
                      {...register("questionTypes.mcq")}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-center font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Short Answer</label>
                    <input 
                      type="number" 
                      min="0"
                      {...register("questionTypes.shortAnswer")}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-center font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Long/Essay</label>
                    <input 
                      type="number" 
                      min="0"
                      {...register("questionTypes.longAnswer")}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-center font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                {errors.questionTypes && <p className="text-red-500 text-sm mt-2">{errors.questionTypes.message}</p>}
              </div>

              {createExam.error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {createExam.error.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || total === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg
                  bg-gradient-to-r from-primary to-primary/90 text-primary-foreground 
                  shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 
                  active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  transition-all duration-200 ease-out"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Protocol...
                  </>
                ) : (
                  "Generate Exam Paper"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
