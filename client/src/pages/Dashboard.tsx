import { Layout } from "@/components/Layout";
import { useExams } from "@/hooks/use-exams";
import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: exams, isLoading, error } = useExams();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-accent animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': 
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Ready</span>;
      case 'failed': 
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Failed</span>;
      default: 
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Processing</span>;
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground">Assessment History</h1>
        <p className="text-muted-foreground mt-2">View and manage your previously generated exam papers.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl h-48 border border-border/50 animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center">
          Failed to load exams. Please try refreshing.
        </div>
      ) : exams?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No exams yet</h3>
          <p className="text-muted-foreground mb-6">Create your first AI-generated assessment from a video.</p>
          <Link href="/" className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover-elevate">
            Create Exam
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams?.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-secondary/50 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                {getStatusBadge(exam.status)}
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">{exam.title}</h3>
              
              <div className="space-y-2 mt-auto pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Format</span>
                  <span className="font-medium text-foreground">{exam.examFormat}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Difficulty</span>
                  <span className="font-medium text-foreground">{exam.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Questions</span>
                  <span className="font-medium text-foreground">{exam.questionCount}</span>
                </div>
                {exam.createdAt && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-2">
                    <span>Created</span>
                    <span>{format(new Date(exam.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <Link 
                href={`/exam/${exam.id}`}
                className="mt-6 w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-secondary/50 text-primary font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
              >
                View Paper <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
