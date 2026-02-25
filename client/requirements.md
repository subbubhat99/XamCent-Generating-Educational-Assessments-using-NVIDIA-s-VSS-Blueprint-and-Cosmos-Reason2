## Packages
framer-motion | Page transitions and smooth entry animations

## Notes
- The application uses `print:hidden` Tailwind classes for the printable exam view, so no external print libraries are strictly necessary.
- Form submissions require Zod coercion for number inputs (e.g., question counts).
- The Exam View page polls `GET /api/exams/:id` every 2 seconds while the exam status is 'pending' or 'processing'.
- We assume `result.questions` in the completed exam object is an array of `{ type, question, options?: string[], answer: string }`.
