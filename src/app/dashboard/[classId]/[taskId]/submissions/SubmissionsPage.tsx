"use client";

import Link from "next/link";
import { useClasses } from "@/app/dashboard/ClassesProvider";
import { notFound } from "next/navigation";
import { useSession } from "@/app/dashboard/SessionProvider";
import { useEffect, useState } from "react";
import { SubmissionType, UserBasic } from "@/utils/classUtils";
import {  getAnswers, getSubmissions, gradeSubmission } from "@/app/actions/taskActions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { JsonValue } from "@prisma/client/runtime/library";

interface Props {
   taskId: number;
   classId: number;
}

export interface SubmissionWithUser extends SubmissionType {
   user: UserBasic;
}

const GradeSubmissions = ({ taskId, classId }: Props) => {
   const { classes } = useClasses();
   const { userId } = useSession();
   const router = useRouter();
   const current = classes.find((c) => c.class_id === classId);
   const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
   const [currentStudentId, setCurrentStudentId] = useState<number>(-1);
   const [points, setPoints] = useState<Record<number, number>>({});
   const [isGrading, setIsGrading] = useState(false);
   const [correctAnswers, setCorrectAnswers] = useState<Array<{
      question_id: number;
      question_type: string;
      correct_answer?: string;
      guidelines?: string | null;
   }> | null>(null);

   if (!current) {
      return notFound();
   }

   const task = current.tasks.find((t) => t.task_id === taskId);

   if (!task) {
      return notFound();
   }

   useEffect(() => {
      const fetchSubmissions = async () => {
         try {
            const answers = await getAnswers(taskId, classId, userId);
            setCorrectAnswers(answers);

            
            const subs = (await getSubmissions(classId, taskId, userId)) as SubmissionWithUser[];
            
            setSubmissions(subs);

            if (subs.length > 0 && !currentStudentId) {
               setCurrentStudentId(subs[0].user_id);
            }

            const initialPoints: Record<number, number> = {};
            subs.forEach((sub) => {
               if (sub.points_earned !== null) {
                  initialPoints[sub.user_id] = sub.points_earned || 0;
               }
            });
            setPoints(initialPoints);

            
         } catch (err) {
            console.error("Error fetching submissions:", err);
            router.push(`/dashboard/${classId}`);
         }
      };
      fetchSubmissions();
   }, [taskId]);

   const currentSubmission = submissions.find(
      (sub) => sub.user_id === currentStudentId
   );

   const parseSubmissionData = (data: JsonValue) => {
      try {
         if (typeof data === "string") {
            return JSON.parse(data);
         }
         return data || [];
      } catch (e) {
         console.error("Error parsing submission data:", e);
         return [];
      }
   };

   const handleGradeSubmit = async () => {
      if (!currentStudentId || !currentSubmission || isGrading || !userId)
         return;

      setIsGrading(true);
      try {
         // Calculate total points (MCQ auto-score + essay scores)
         let totalPoints = 0;

         // Add points from MCQ questions
         const submissionData = parseSubmissionData(
            currentSubmission.submission_data
         );

         task.questions.forEach((question) => {
            if (question.question_type === "MCQ") {
               const correctAnswer = correctAnswers?.find(
                  (a) => a.question_id === question.question_id
               );
               const userAnswer = submissionData.find(
                  (a: any) => a.question_id === question.question_id
               )?.answer;

               if (userAnswer === correctAnswer?.correct_answer) {
                  totalPoints += question.points;
               }
            }
         });

         // Add points from essay questions
         task.questions.forEach((question) => {
            if (question.question_type === "Essay") {
               totalPoints += essayScores[question.question_id] || 0;
            }
         });
         
         await gradeSubmission(
            currentSubmission.submission_id,
            points[currentStudentId] || 0, // Use auto-calculated points
            userId,
            classId
         );

         toast.success("Grade submitted successfully!");
         setSubmissions((prev) =>
            prev.map((sub) =>
               sub.user_id === currentStudentId
                  ? {
                       ...sub,
                       points_earned: totalPoints,
                       is_graded: true,
                       graded_by: userId,
                    }
                  : sub
            )
         );
      } catch (err) {
         toast.error(
            err instanceof Error ? err.message : "Failed to submit grade"
         );
         console.error("Error grading submission:", err);
      } finally {
         setIsGrading(false);
      }
   };
   const [essayScores, setEssayScores] = useState<Record<number, number>>({});


   const handleEssayScoreChange = (questionId: number, score: number) => {
      const question = task.questions.find((q) => q.question_id === questionId);
      const maxPoints = question?.points || 0;
      const validatedScore = Math.min(Math.max(score, 0), maxPoints);

      setEssayScores((prev) => ({
         ...prev,
         [questionId]: validatedScore,
      }));

      // Auto-update the total points
      if (currentStudentId !== null) {
         setPoints((prev) => {
            // Calculate MCQ points
            const submissionData = parseSubmissionData(
               currentSubmission?.submission_data || []
            );
            const mcqPoints = task.questions.reduce((total, q) => {
               if (q.question_type === "MCQ") {
                  const userAnswer = submissionData.find(
                     (a: { question_id: number; }) => a.question_id === q.question_id
                  )?.answer;
                  const correctAnswer = correctAnswers?.find(
                     (a) => a.question_id === q.question_id
                  );
                  
                  return (
                     total +
                     (userAnswer === correctAnswer ? q.points : 0)
                  );

               }
               return total;
            }, 0);

            // Calculate total essay points
            const essayPoints = Object.values({
               ...essayScores,
               [questionId]: validatedScore,
            }).reduce((sum, s) => sum + (s || 0), 0);

            return {
               ...prev,
               [currentStudentId]: mcqPoints + essayPoints,
            };
         });
      }
   };

   const allEssaysGraded = () => {
      return task.questions.every((question) => {
         if (question.question_type !== "Essay") return true;
         return essayScores[question.question_id] !== undefined;
      });
   };

   return (
      <div className="flex flex-col min-h-screen bg-white p-6 w-full max-w-8xl">
         <div className="flex justify-between items-center mb-6">
            <Link
               href={`/dashboard/${classId}`}
               className="text-blue-600 hover:underline"
            >
               ← Back to task
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex gap-2">
               Task: <p className="font-normal">{task.task_title}</p>
            </h1>

            <div className="w-24"></div>
         </div>

         <div className="flex gap-6 ">
            <div className="w-64 border-r pr-4 ">
               <h2 className="font-semibold text-lg mb-4 text-gray-600">
                  Submissions
               </h2>
               <div className="space-y-2">
                  {submissions.map((submission) => (
                     <button
                        key={submission.submission_id}
                        onClick={() => setCurrentStudentId(submission.user_id)}
                        className={`w-full text-left p-2 rounded ${
                           currentStudentId === submission.user_id
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-100"
                        }`}
                     >
                        <div className="flex justify-between items-center">
                           <span>{submission.user.username}</span>
                           {submission.is_graded && (
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                 Graded
                              </span>
                           )}
                        </div>
                        <div className="text-sm text-gray-500">
                           Attempt: {submission.attempt_number}
                           {submission.points_earned !== null && (
                              <span className="ml-2 font-medium">
                                 ({submission.points_earned} pts)
                              </span>
                           )}
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="flex-1">
               {currentSubmission ? (
                  <div className="space-y-6 text-gray-600">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                           {currentSubmission.user.username}
                        </h2>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                 Total Score:
                              </span>
                              <div className="w-20 border rounded p-1 text-center bg-gray-50">
                                 {points[currentStudentId] ?? 0}
                              </div>
                              <span>/ {task.total_points}</span>
                           </div>
                           <button
                              onClick={handleGradeSubmit}
                              disabled={isGrading || !allEssaysGraded()}
                              className={`px-4 py-2 text-white rounded hover:bg-blue-700 ${
                                 isGrading || !allEssaysGraded()
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600"
                              }`}
                           >
                              {isGrading ? "Saving..." : "Save Grade"}
                           </button>
                           {!allEssaysGraded() && (
                              <span className="text-sm text-red-500">
                                 Please grade all essay questions before
                                 submitting
                              </span>
                           )}
                        </div>
                     </div>

                     <div className="text-sm text-gray-500 mb-4">
                        Submitted on:{" "}
                        {new Date(
                           currentSubmission.submission_time
                        ).toLocaleString()}
                     </div>

                     {task.questions.map((question, qIndex) => {
                        const submissionAnswers = parseSubmissionData(
                           currentSubmission.submission_data
                        );
                        const answerData = submissionAnswers.find(
                           (a: any) => a.question_id === question.question_id
                        );
                        const correctAnswer = correctAnswers?.find(
                           (a) => a.question_id === question.question_id
                        );
                        const answer = answerData?.answer;

                        return (
                           <div
                              key={question.question_id}
                              className="border rounded-lg p-4 text-gray-500"
                           >
                              <div className="flex justify-between items-start">
                                 <h2 className="font-medium">
                                    Question {qIndex + 1} (
                                    {question.question_type})
                                 </h2>
                                 {question.question_type === "Essay" && (
                                    <div className="flex items-center gap-2 text-sm">
                                       <input
                                          type="number"
                                          min="0"
                                          max={question.points}
                                          value={
                                             essayScores[
                                                question.question_id
                                             ] ?? ""
                                          }
                                          onChange={(e) =>
                                             handleEssayScoreChange(
                                                question.question_id,
                                                Number(e.target.value)
                                             )
                                          }
                                          className="w-16 border rounded p-1 text-center"
                                       />
                                       <span>/ {question.points} pts</span>
                                    </div>
                                 )}
                                 {question.question_type !== "Essay" && (
                                    <span className="text-sm">
                                       {question.points} pts
                                    </span>
                                 )}
                              </div>

                              <p className="mt-2 mb-4">
                                 {question.question_text}
                              </p>

                              {question.question_type === "MCQ" && correctAnswers ? (
                                 <div className="space-y-2">
                                    {question.mcq_question?.choices.map(
                                       (choice, cIndex) => (
                                          <div
                                             key={cIndex}
                                             className="flex items-center gap-2"
                                          >
                                             <input
                                                type="radio"
                                                name={`q-${question.question_id}-${currentSubmission.submission_id}`}
                                                checked={answer === choice}
                                                readOnly
                                                className="cursor-default"
                                             />
                                             <label
                                                className={`${
                                                   answer === choice
                                                      ? correctAnswer?.correct_answer ===
                                                        choice
                                                         ? "text-green-600 font-medium"
                                                         : "text-red-600 font-medium"
                                                      : ""
                                                } ${
                                                   correctAnswer?.correct_answer ===
                                                   choice
                                                      ? "text-green-600"
                                                      : ""
                                                }`}
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
                                       className="w-full border rounded p-2 bg-gray-50"
                                       rows={4}
                                       value={answer || ""}
                                       readOnly
                                    />
                                    {question.question_type === "Essay" && (
                                       <p className="text-sm text-gray-500">
                                          Guidelines:{" "}
                                          {question.essay_question.guidelines}
                                       </p>
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="text-center text-gray-500 py-10">
                     {submissions.length === 0
                        ? "No submissions yet"
                        : "Select a student to view their submission"}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default GradeSubmissions;
