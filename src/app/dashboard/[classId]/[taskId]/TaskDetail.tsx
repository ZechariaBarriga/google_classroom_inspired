"use client";

import Link from "next/link";
import { useClasses } from "../../ClassesProvider";
import { notFound, useRouter } from "next/navigation";
import { getUserSubmissions, submitTask } from "@/app/actions/taskActions";
import { useSession } from "../../SessionProvider";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
   taskId: number;
   classId: number;
}

const TaskDetail = ({ taskId, classId }: Props) => {
   const { classes } = useClasses();
   const { userId } = useSession();
   const [answers, setAnswers] = useState<Record<number, string | string[]>>(
      {}
   );
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const current = classes.find((c) => c.class_id === classId);

   const [isTeacher, setIsTeacher] = useState(false);
   const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

   if (!current) {
      return notFound();
   }

   const task = current.tasks.find((t) => t.task_id === taskId);

   if (!task) {
      return notFound();
   }

   useEffect(() => {
      const checkSubmission = async () => {
         try {
            const teacherCheck = current.members.some(
               (m) => m.user_id === userId && m.role === "Teacher"
            );

            setIsTeacher(teacherCheck);

            if (!teacherCheck && userId) {
               if (!userId || isTeacher) return notFound();

               const submissions = await getUserSubmissions(taskId, userId);
               console.log(submissions)
               const highestAttempt =
                  submissions.length > 0
                     ? Math.max(...submissions.map((s) => s.attempt_number))
                     : 0;
               const maxAttempts = task?.max_attempts ?? 1;
               setAttemptsLeft(maxAttempts - highestAttempt);
            }
         } catch (err) {
            console.error("Error checking submission:", err);
         }
      };
      checkSubmission();
   }, [userId, taskId, current]);

   const handleAnswerChange = (
      questionId: number,
      value: string | string[]
   ) => {
      setAnswers((prev) => ({
         ...prev,
         [questionId]: value,
      }));
   };

   const handleSubmit = async () => {
      if (!userId) return;

      setIsSubmitting(true);
      setError(null);

      try {
         // Format answers for submission
         const formattedAnswers = task.questions.map((question) => ({
            question_id: question.question_id,
            answer:
               answers[question.question_id] ||
               (question.question_type === "MCQ" ? [] : ""),
         }));

         await submitTask(taskId, formattedAnswers, userId);
         toast.success("Task submitted successfully!");
         setAttemptsLeft((prev) => (prev !== null ? prev - 1 : null));
      } catch (err) {
         setError(err instanceof Error ? err.message : "Failed to submit task");
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white p-6 w-full max-w-8xl">
         <div className="w-[50%]">
            <Link
               href={`/dashboard/${classId}`}
               className="text-blue-600 hover:underline mb-4 inline-block"
            >
               ← Back to all tasks
            </Link>

            <div className="mb-6 text-gray-800">
               <h1 className="text-2xl font-bold">{task.task_title}</h1>
               <p className="text-gray-600">{task.task_description}</p>
               <div className="mt-2 text-sm text-gray-500">
                  Due: {new Date(task.deadline).toLocaleDateString()} •{" "}
                  {task.total_points} points
               </div>
            </div>
         </div>

         <div className="space-y-6 w-[50%]">
            {task.questions.map((question, qIndex) => (
               <div
                  key={question.question_id}
                  className="border rounded-lg p-4 text-gray-500"
               >
                  <div className="flex justify-between">
                     <h2 className="font-medium">
                        Question {qIndex + 1} ({question.question_type})
                     </h2>
                     <span className="text-sm">{question.points} pts</span>
                  </div>

                  <p className="mt-2 mb-4">{question.question_text}</p>

                  {question.question_type === "MCQ" ? (
                     <div className="space-y-2">
                        {question?.mcq_question?.choices.map(
                           (choice, cIndex) => (
                              <div
                                 key={cIndex}
                                 className="flex items-center gap-2"
                              >
                                 <input
                                    type="radio"
                                    name={`q-${question.question_id}`}
                                    id={`q-${question.question_id}-${cIndex}`}
                                    onChange={() =>
                                       handleAnswerChange(
                                          question.question_id,
                                          choice
                                       )
                                    }
                                 />
                                 <label
                                    htmlFor={`q-${question.question_id}-${cIndex}`}
                                 >
                                    {choice}
                                 </label>
                              </div>
                           )
                        )}
                     </div>
                  ) : (
                     <div className="space-y-2">
                        <textarea
                           className="w-full border rounded p-2"
                           rows={4}
                           placeholder="Your answer..."
                           value={
                              (answers[question.question_id] as string) || ""
                           }
                           onChange={(e) =>
                              handleAnswerChange(
                                 question.question_id,
                                 e.target.value
                              )
                           }
                        />
                        {question.essay_question?.guidelines && (
                           <p className="text-sm text-gray-500">
                              Guidelines: {question.essay_question?.guidelines}
                           </p>
                        )}
                     </div>
                  )}
               </div>
            ))}

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            {!isTeacher && (
               <div className="mt-6 pt-4 border-t flex justify-end">
                  {attemptsLeft !== null && (
                     <span className="text-sm text-gray-500">
                        Attempts left: {attemptsLeft}/{task.max_attempts}
                     </span>
                  )}
                  <button
                     onClick={handleSubmit}
                     disabled={isSubmitting || attemptsLeft === 0}
                     className={`px-4 py-2 rounded ${
                        attemptsLeft === 0
                           ? "bg-gray-400 cursor-not-allowed"
                           : "bg-blue-600 hover:bg-blue-700 text-white"
                     }`}
                  >
                     {attemptsLeft === 0
                        ? "No attempts left"
                        : isSubmitting
                        ? "Submitting..."
                        : "Submit Answers"}
                  </button>
               </div>
            )}
         </div>
      </div>
   );
};

export default TaskDetail;
