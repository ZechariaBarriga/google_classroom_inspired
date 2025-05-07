"use server";

import prisma from "@/lib/prisma";
import { ClassType } from "@/utils/classUtils";


export async function verifyTeacher(classId: number, userId: number) {
   const membership = await prisma.classMembership.findUnique({
      where: {
         class_id_user_id: {
            class_id: classId,
            user_id: userId,
         },
      },
   });
   
   if (!membership || membership.role !== "Teacher") {
      throw new Error("Unauthorized to grade this submission");
   }
}

export async function getUserSubmissions(taskId: number, userId: number) {
   return prisma.submission.findMany({
      where: { task_id: taskId, user_id: userId },
      include: {
         user: {
            select: {
               user_id: true,
               username: true,
            },
         },
      },
   });
}

export async function getSubmissions(classId: number, taskId: number, userId: number) {
   await verifyTeacher(classId, userId);

   return await prisma.submission.findMany({
      where: { task_id: taskId },
      include: {
         user: {
            select: {
               user_id: true,
               username: true,
            },
         },
         task: {
            include: {
               questions: true,
            },
         },
      },
   });
}

// Submit answers to a task
export async function submitTask(
   taskId: number,
   answers: Array<{ question_id: number; answer: string | string[] }>,
   userId: number,
) {
   return await prisma.$transaction(async (tx) => {
      // 1. Verify task and get attempt limit (include questions now)
      const task = await tx.task.findUnique({
         where: { task_id: taskId },
         include: {
            questions: {
               include: {
                  mcq_question: true,
                  essay_question: true,
               },
            },
         },
      });
      if (!task) throw new Error("Task not found");
      if (new Date() > task.deadline) throw new Error("Deadline passed");

      // 2. Verify class membership
      const membership = await tx.classMembership.findUnique({
         where: {
            class_id_user_id: {
               class_id: task.class_id,
               user_id: userId,
            },
         },
      });
      if (!membership) throw new Error("Not class member");

      // 3. Check existing submission
      const existing = await tx.submission.findFirst({
         where: { task_id: taskId, user_id: userId },
         orderBy: { submission_time: "desc" },
      });

      // 4. Validate attempts (only count creates, not updates)
      const attemptCount = existing?.attempt_number || 0;
      if (attemptCount >= task.max_attempts) {
         throw new Error(`Maximum attempts (${task.max_attempts}) reached`);
      }

      // 5. Auto-grade MCQs if no essay questions
      const hasEssayQuestions = task.questions.some(
         (q) => q.question_type === "Essay"
      );
      let pointsEarned = null;

      if (!hasEssayQuestions) {
         pointsEarned = task.questions.reduce((total, question) => {
            if (question.question_type === "MCQ") {
               const answer = answers.find(
                  (a) => a.question_id === question.question_id
               )?.answer;
               return (
                  total +
                  (answer === question.mcq_question?.correct_answer
                     ? question.points
                     : 0)
               );
            }
            return total;
         }, 0);
      }

      // 6. Upsert logic with auto-grading
      const submissionData = {
         submission_data: answers,
         submission_time: new Date(),
         attempt_number: existing ? existing.attempt_number + 1 : 1,
         ...(!hasEssayQuestions && {
            points_earned: pointsEarned,
            is_graded: true,
         }),
      };

      return existing
         ? await tx.submission.update({
              where: { submission_id: existing.submission_id },
              data: submissionData,
           })
         : await tx.submission.create({
              data: {
                 task_id: taskId,
                 user_id: userId,
                 ...submissionData,
              },
           });
   });
}

export async function upsertTask(
   {
      taskTitle,
      taskDescription,
      startDate,
      deadline,
      questions,
      classId,
      taskId,
      maxAttempts,
   }: {
      taskTitle: string;
      taskDescription?: string;
      startDate: Date;
      deadline: Date;
      questions: Array<{
         question_id?: number;
         question_type: "MCQ" | "Essay";
         question_text: string;
         points: number;
         choices?: string[];
         correct_answer?: string;
         guidelines?: string;
      }>;
      classId: number;
      taskId?: number;
      maxAttempts: number;
   },
   userId: number
): Promise<ClassType> {

   await verifyTeacher(classId, userId);

   return await prisma.$transaction(async (tx) => {
      // Calculate total points from all questions
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

      // 1. Upsert the main task
      const task = await tx.task.upsert({
         where: { task_id: taskId ?? -1 }, // Fallback ID for create case
         update: {
            task_title: taskTitle,
            task_description: taskDescription,
            start_date: startDate,
            deadline: deadline,
            total_points: totalPoints,
            max_attempts: maxAttempts
         },
         create: {
            class_id: classId,
            task_title: taskTitle,
            task_description: taskDescription,
            start_date: startDate,
            deadline: deadline,
            total_points: totalPoints,
            status: "published",
            max_attempts: maxAttempts
         },
      });

      // 2. Get existing questions if in edit mode
      const existingQuestions = taskId
         ? await tx.question.findMany({
              where: { task_id: task.task_id },
              include: {
                 mcq_question: true,
                 essay_question: true,
              },
           })
         : [];

      // 3. Process all questions
      const questionsToKeep: number[] = [];

      for (const question of questions) {
         // Determine if this is an existing question
         const isExisting = existingQuestions.some(
            (q) => q.question_id === question.question_id
         );

         // Upsert the base question
         const upsertedQuestion = await tx.question.upsert({
            where: {
               question_id: isExisting ? question.question_id! : -1,
            },
            update: {
               question_text: question.question_text,
               points: question.points,
               question_type: question.question_type,
            },
            create: {
               task_id: task.task_id,
               question_type: question.question_type,
               question_text: question.question_text,
               points: question.points,
            },
         });

         questionsToKeep.push(upsertedQuestion.question_id);

         // Handle question type-specific data
         if (question.question_type === "MCQ") {
            await tx.mCQQuestion.upsert({
               where: { question_id: upsertedQuestion.question_id },
               update: {
                  choices: question.choices || [],
                  correct_answer: question.correct_answer || "",
               },
               create: {
                  question_id: upsertedQuestion.question_id,
                  choices: question.choices || [],
                  correct_answer: question.correct_answer || "",
               },
            });

            // Remove essay question if it existed
            await tx.essayQuestion.deleteMany({
               where: { question_id: upsertedQuestion.question_id },
            });
         } else {
            await tx.essayQuestion.upsert({
               where: { question_id: upsertedQuestion.question_id },
               update: {
                  guidelines: question.guidelines || "",
               },
               create: {
                  question_id: upsertedQuestion.question_id,
                  guidelines: question.guidelines || "",
               },
            });

            // Remove MCQ question if it existed
            await tx.mCQQuestion.deleteMany({
               where: { question_id: upsertedQuestion.question_id },
            });
         }
      }

      // 4. Delete questions that were removed (only in edit mode)
      if (taskId) {
         await tx.question.deleteMany({
            where: {
               task_id: task.task_id,
               question_id: { notIn: questionsToKeep },
            },
         });
      }

      // 5. Return the updated class with all tasks
      const updatedClass = await tx.class.findUnique({
         where: { class_id: classId },
         include: {
            createdBy: {
               select: {
                  user_id: true,
                  username: true,
                  email: true,
               },
            },
            members: {
               include: {
                  user: {
                     select: {
                        user_id: true,
                        username: true,
                        email: true,
                     },
                  },
               },
            },
            tasks: {
               include: {
                  questions: {
                     include: {
                        mcq_question: true,
                        essay_question: true,
                     },
                     orderBy: { question_id: "asc" },
                  },
               },
               orderBy: { created_at: "desc" },
            },
         },
      });

      if (!updatedClass) {
         throw new Error("Failed to fetch updated class data");
      }

      // Transform to match ClassType exactly
      return {
         ...updatedClass,
         members: updatedClass.members.map((member) => ({
            class_id: member.class_id,
            user_id: member.user_id,
            role: member.role,
            user: member.user,
         })),
         tasks: updatedClass.tasks.map((task) => ({
            ...task,
            questions: task.questions.map((question) => ({
               question_id: question.question_id,
               question_type: question.question_type as "MCQ" | "Essay",
               question_text: question.question_text,
               points: question.points,
               mcq_question: question.mcq_question
                  ? {
                       choices: question.mcq_question.choices,
                       correct_answer: question.mcq_question.correct_answer,
                    }
                  : null,
               essay_question: question.essay_question
                  ? {
                       guidelines: question.essay_question.guidelines || null,
                    }
                  : null,
            })),
         })),
      } as ClassType;
   });
}

export async function deleteTask(taskId: number, classId: number, userId: number) {
   try {
      await verifyTeacher(classId, userId);
      await prisma.task.delete({ where: { task_id: taskId } });
   } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error("Failed to delete task");
   }
}
export async function gradeSubmission(
   submissionId: number,
   totalPoints: number,
   gradedBy: number,
   classId: number
) {
   return await prisma.$transaction(async (tx) => {
      // 1. Verify submission and get task details
      const submission = await tx.submission.findUnique({
         where: { submission_id: submissionId },
         include: {
            task: {
               include: {
                  class: true,
                  questions: {
                     include: {
                        mcq_question: true,
                     },
                  },
               },
            },
         },
      });

      if (!submission) {
         throw new Error("Submission not found");
      }

      // 2. Verify grader is a teacher in this class
      await verifyTeacher(classId, gradedBy);

      // 3. Update the submission
      const updatedSubmission = await tx.submission.update({
         where: { submission_id: submissionId },
         data: {
            points_earned: totalPoints,
            is_graded: true,
            graded_by: gradedBy,
         },
      });

      // 4. Update leaderboard
      await tx.leaderboard.upsert({
         where: {
            class_id_user_id: {
               class_id: submission.task.class_id,
               user_id: submission.user_id,
            },
         },
         update: {
            total_points: {
               increment: totalPoints,
            },
            last_updated: new Date(),
         },
         create: {
            class_id: submission.task.class_id,
            user_id: submission.user_id,
            total_points: totalPoints,
            last_updated: new Date(),
         },
      });

      return updatedSubmission;
   });
}

export async function getAnswers(taskId: number, classId: number, userId: number) {
   try {
      // Verify user has access to this class
      const classMember = await prisma.classMembership.findUnique({
         where: {
         class_id_user_id: {
            class_id: classId,
            user_id: userId
         }
         }
      });

      if (!classMember) {
         throw new Error("User not in this class");
      }

      // Teachers can always view answers, students must have submitted
      if (classMember.role !== "Teacher") {
         const submissionExists = await prisma.submission.findFirst({
         where: {
            task_id: taskId,
            user_id: userId,
         },
         });

         if (!submissionExists) {
            throw new Error("Submit the task first to view answers");
         }
      }

      const answers = await prisma.question.findMany({
         where: { task_id: taskId },
         select: {
         question_id: true,
         question_type: true,
         mcq_question: { select: { correct_answer: true } },
         essay_question: { select: { guidelines: true } },
         },
      });

      return answers.map(q => ({
         question_id: q.question_id,
         question_type: q.question_type,
         ...(q.mcq_question && { correct_answer: q.mcq_question.correct_answer }),
         ...(q.essay_question && { guidelines: q.essay_question.guidelines }),
      }));

   } catch (error) {
      console.error("Detailed error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch answers");
   }
}