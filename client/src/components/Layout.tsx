import { Link, useLocation } from "wouter";
import { BookOpen, History, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "New Exam", icon: PlusCircle },
    { href: "/dashboard", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      {/* Navbar - hidden during print */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-primary">
                XamCent
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? "text-accent" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
      
      {/* Footer - hidden during print */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 bg-white/50 print:hidden">
        <p>© {new Date().getFullYear()} XamCent. Generative Educational Assessments.</p>
      </footer>
    </div>
  );
}
