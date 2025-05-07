"use client";

import React, { useEffect, useState } from "react";
import { upsertTask, verifyTeacher } from "@/app/actions/taskActions";
import { notFound, useRouter } from "next/navigation";
import { useSession } from "../SessionProvider";
import { useClasses } from "../ClassesProvider";
import { toast } from "react-toastify";

type QuestionType = "MCQ" | "Essay";
type Mode = "create" | "edit";

interface Question {
   question_id?: number | string; // Allow both real and temp IDs
   question_type: QuestionType;
   question_text: string;
   points: number;
   choices?: string[];
   correct_answer?: string;
   guidelines?: string;
}

interface ManageTabProps {
   classId: number;
   mode: Mode;
   taskId?: number;
   onSuccess?: () => void;
}

const ManageTab = ({ classId, mode = "create", taskId, onSuccess }: ManageTabProps) => {
   const router = useRouter();
   const { userId } = useSession();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(mode === "edit");
   const { classes, refreshClasses } = useClasses();

   const [formData, setFormData] = useState({
      taskTitle: "",
      taskDescription: "",
      startDate: "",
      deadline: "",
      maxAttempts: 1,
   });

   const [questions, setQuestions] = useState<Question[]>([]);
   const classData = classes.find((c) => c.class_id === classId);

   if (!classData) {
      return notFound();
   }
   // Load task data in edit mode
   useEffect(() => {
      if (mode === "edit" && taskId) {
         const loadTask = async () => {
            try {
               await verifyTeacher(classId, userId);
               const task = classData.tasks.find((t) => t.task_id === taskId);
               if (task) {
                  setFormData({
                     taskTitle: task.task_title,
                     taskDescription: task.task_description || "",
                     startDate: task.start_date.toISOString().slice(0, 16),
                     deadline: task.deadline.toISOString().slice(0, 16),
                     maxAttempts: task.max_attempts || 1,
                  });
                  setQuestions(
                     task.questions.map((q) => ({
                        question_id: q.question_id,
                        question_type: q.question_type,
                        question_text: q.question_text,
                        points: q.points,
                        ...(q.question_type === "MCQ"
                           ? {
                                choices: q.mcq_question?.choices || [],
                              //   correct_answer:
                                 //   q.mcq_question?.correct_answer || "",
                             }
                           : {
                                guidelines: q.essay_question?.guidelines || "",
                             }),
                     }))
                  );
               }
            } catch (error) {
               console.error("Error loading task:", error);
               router.push(`/dashboard/${classData.class_id}`);
               router.refresh();
            } finally {
               setIsLoading(false);
            }
         };
         
         loadTask();
      }
   }, [mode, taskId, classData, router]);

   const addQuestion = (type: QuestionType) => {
      const newQuestion: Question = {
         question_type: type,
         question_text: "",
         points: 1,
         ...(type === "MCQ"
            ? {
                 choices: ["", ""],
                 correct_answer: "",
              }
            : {
                 guidelines: "",
              }),
         // Add temporary ID only in edit mode
         ...(mode === "edit" && {
            question_id: `temp-${Date.now()}-${Math.random()
               .toString(36)
               .substr(2, 9)}`,
         }),
      };
      setQuestions([...questions, newQuestion]);
   };

   // Helper functions for question management
   const updateQuestion = (index: number, field: keyof Question, value: any) => {
      const updated = [...questions];
      updated[index] = { ...updated[index], [field]: value };

      // If updating choices, ensure it's always an array
      if (field === "choices" && !Array.isArray(updated[index].choices)) {
         updated[index].choices = [];
      }

      setQuestions(updated);
   };


   const updateMcqChoice = (qIndex: number, cIndex: number, value: string) => {
      const updated = [...questions];
      const choices = [...(updated[qIndex].choices || [])];
      choices[cIndex] = value;
      updated[qIndex] = { ...updated[qIndex], choices };
      setQuestions(updated);
   };

   const addMcqChoice = (qIndex: number) => {
      const updated = [...questions];
      const choices = [...(updated[qIndex].choices || []), ""];
      updated[qIndex] = { ...updated[qIndex], choices };
      setQuestions(updated);
   };

   const removeMcqChoice = (qIndex: number, cIndex: number) => {
      const updated = [...questions];
      const choices = [...(updated[qIndex].choices || [])];
      choices.splice(cIndex, 1);
      updated[qIndex] = { ...updated[qIndex], choices };
      setQuestions(updated);
   };

   const removeQuestion = (index: number) => {
      const updated = [...questions];
      updated.splice(index, 1);
      setQuestions(updated);
   };

   const calculateTotalPoints = () =>
      questions.reduce((sum, q) => sum + q.points, 0);

   const handleSubmit = async () => {
      // Validation
      if (!formData.taskTitle) return toast.error("Task title is required");
      if (!formData.startDate || !formData.deadline)
         return toast.error("Dates are required");
      if (questions.length === 0)
         return toast.error("Add at least one question");
      if (formData.maxAttempts < 1)
         return toast.error("Maximum attempts must be at least 1");

      for (const q of questions) {
         if (!q.question_text.trim())
            return toast.error("All questions need text");

         if (q.question_type === "MCQ") {
            if (!Array.isArray(q.choices) || q.choices.length === 0) {
               return toast.error("MCQ questions must have options");
            }
            if (!q.correct_answer)
               return toast.error("Select correct answer for MCQ");
            if (q.choices.some((c) => !c.trim()))
               return toast.error("Fill all MCQ options");
            if (!q.choices.includes(q.correct_answer)) {
               return toast.error(
                  "Correct answer must match one of the options"
               );
            }
         }
      }

      setIsSubmitting(true);
      try {
         await upsertTask(
            {
               classId: classData.class_id,
               taskId: mode === "edit" ? taskId : undefined,
               taskTitle: formData.taskTitle,
               taskDescription: formData.taskDescription,
               startDate: new Date(formData.startDate),
               deadline: new Date(formData.deadline),
               maxAttempts: formData.maxAttempts,
               questions: questions.map((q) => ({
                  question_id:
                     typeof q.question_id === "string"
                        ? undefined // For new questions, omit the ID (set it to undefined)
                        : q.question_id,
                  question_type: q.question_type,
                  question_text: q.question_text,
                  points: q.points,
                  ...(q.question_type === "MCQ"
                     ? {
                          choices: q.choices || [],
                          correct_answer: q.correct_answer || "",
                       }
                     : {
                          guidelines: q.guidelines || "",
                       }),
               })),
            },
            userId
         );

         refreshClasses();
         
         if (onSuccess && mode === "create") {
            toast.success("Create task successful!");
            onSuccess();
            
         } else if (mode === "edit") {
            toast.success("Upsert successful!");
            router.push(`/dashboard/${classData.class_id}`);
         }

      } catch (error) {
         toast.error(`Failed to ${mode === "create" ? "create" : "update"} task`);

      } finally {
         setIsSubmitting(false);
      }
   };

   if (isLoading) return <div>Loading task data...</div>;

   return (
      <div className=" bg-white">
         <div className="min-h-screen p-4 max-w-3xl mx-auto h-[calc(100vh-100px)] overflow-y-auto text-gray-600">
            <div className="sticky top-0 z-10 p-4 border-b flex justify-between items-center ">
               <h2 className="text-xl font-bold">
                  {mode === "create" ? "Create New Task" : "Edit Task"}
               </h2>
               <div className="flex gap-2">
                  <button
                     onClick={() => addQuestion("MCQ")}
                     className="bg-blue-100 text-blue-800 px-4 py-2 rounded text-sm"
                  >
                     + MCQ
                  </button>
                  <button
                     onClick={() => addQuestion("Essay")}
                     className="bg-green-100 text-green-800 px-4 py-2 rounded text-sm"
                  >
                     + Essay
                  </button>
               </div>
            </div>

            <div className="space-y-4 my-6">
               {/* Task Details Form */}
               <div>
                  <label className="block font-medium mb-1">Task Title*</label>
                  <input
                     type="text"
                     value={formData.taskTitle}
                     onChange={(e) =>
                        setFormData({ ...formData, taskTitle: e.target.value })
                     }
                     className="border p-2 rounded w-full"
                     placeholder="Enter task title"
                  />
               </div>

               <div>
                  <label className="block font-medium mb-1">Description</label>
                  <textarea
                     value={formData.taskDescription}
                     onChange={(e) =>
                        setFormData({
                           ...formData,
                           taskDescription: e.target.value,
                        })
                     }
                     className="border p-2 rounded w-full"
                     rows={3}
                     placeholder="Task description"
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block font-medium mb-1">
                        Start Date*
                     </label>
                     <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              startDate: e.target.value,
                           })
                        }
                        className="border p-2 rounded w-full"
                     />
                  </div>
                  <div>
                     <label className="block font-medium mb-1">Deadline*</label>
                     <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              deadline: e.target.value,
                           })
                        }
                        className="border p-2 rounded w-full"
                     />
                  </div>
               </div>

               {/* Questions Section */}
               <div className="mt-8">
                  <h3 className="font-medium mb-4">Questions</h3>

                  {questions.length === 0 ? (
                     <div className="text-center py-4 text-gray-500">
                        No questions added yet
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {questions.map((question, qIndex) => (
                           <div key={qIndex} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                 <h4 className="font-medium">
                                    Question {qIndex + 1} (
                                    {question.question_type})
                                 </h4>
                                 <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className="text-red-500 hover:text-red-700"
                                 >
                                    Remove
                                 </button>
                              </div>

                              <div className="mb-3">
                                 <label className="block text-sm font-medium mb-1">
                                    Question Text*
                                 </label>
                                 <input
                                    type="text"
                                    value={question.question_text}
                                    onChange={(e) =>
                                       updateQuestion(
                                          qIndex,
                                          "question_text",
                                          e.target.value
                                       )
                                    }
                                    className="border p-2 rounded w-full"
                                    placeholder="Enter question"
                                 />
                              </div>

                              <div className="mb-3">
                                 <label className="block text-sm font-medium mb-1">
                                    Points*
                                 </label>
                                 <input
                                    type="number"
                                    min="1"
                                    value={question.points}
                                    onChange={(e) =>
                                       updateQuestion(
                                          qIndex,
                                          "points",
                                          parseInt(e.target.value)
                                       )
                                    }
                                    className="border p-2 rounded w-20"
                                 />
                              </div>

                              {question.question_type === "MCQ" &&
                              Array.isArray(question.choices) ? (
                                 <div className="space-y-3">
                                    <div>
                                       <label className="block text-sm font-medium mb-1">
                                          Options*
                                       </label>
                                       {question.choices?.map(
                                          (choice, cIndex) => (
                                             <div
                                                key={cIndex}
                                                className="flex items-center gap-2 mb-1"
                                             >
                                                <input
                                                   type="text"
                                                   value={choice}
                                                   onChange={(e) =>
                                                      updateMcqChoice(
                                                         qIndex,
                                                         cIndex,
                                                         e.target.value
                                                      )
                                                   }
                                                   className="border p-2 rounded flex-1"
                                                   placeholder={`Option ${
                                                      cIndex + 1
                                                   }`}
                                                />
                                                {question.choices!.length >
                                                   2 && (
                                                   <button
                                                      onClick={() =>
                                                         removeMcqChoice(
                                                            qIndex,
                                                            cIndex
                                                         )
                                                      }
                                                      className="text-red-500 px-2"
                                                   >
                                                      ×
                                                   </button>
                                                )}
                                             </div>
                                          )
                                       )}
                                       {question.choices!.length < 6 && (
                                          <button
                                             onClick={() =>
                                                addMcqChoice(qIndex)
                                             }
                                             className="text-sm text-blue-500 mt-1"
                                          >
                                             + Add Option
                                          </button>
                                       )}
                                    </div>

                                    <div>
                                       <label className="block text-sm font-medium mb-1">
                                          Correct Answer*
                                       </label>
                                       <select
                                          value={question.correct_answer || ""}
                                          onChange={(e) =>
                                             updateQuestion(
                                                qIndex,
                                                "correct_answer",
                                                e.target.value
                                             )
                                          }
                                          className="border p-2 rounded w-full"
                                       >
                                          <option value="">
                                             Select correct answer
                                          </option>
                                          {question.choices?.map(
                                             (choice, cIndex) => (
                                                <option
                                                   key={cIndex}
                                                   value={choice}
                                                >
                                                   {choice ||
                                                      `Option ${cIndex + 1}`}
                                                </option>
                                             )
                                          )}
                                       </select>
                                    </div>
                                 </div>
                              ) : (
                                 <div>
                                    <label className="block text-sm font-medium mb-1">
                                       Guidelines
                                    </label>
                                    <textarea
                                       value={question.guidelines || ""}
                                       onChange={(e) =>
                                          updateQuestion(
                                             qIndex,
                                             "guidelines",
                                             e.target.value
                                          )
                                       }
                                       className="border p-2 rounded w-full"
                                       rows={3}
                                       placeholder="Essay guidelines"
                                    />
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
            <div>
               <label className="block font-medium mb-1">Max Attempts*</label>
               <input
                  type="number"
                  min="1"
                  value={formData.maxAttempts}
                  onChange={(e) =>
                     setFormData({
                        ...formData,
                        maxAttempts: parseInt(e.target.value) || 1,
                     })
                  }
                  className="border p-2 rounded w-20"
               />
            </div>
            <div className="flex justify-between items-center mt-6">
               <div className="font-medium">
                  Total Points: {calculateTotalPoints()}
               </div>
               <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded disabled:opacity-50"
               >
                  {isSubmitting
                     ? `${mode === "create" ? "Creating..." : "Updating..."}`
                     : `${mode === "create" ? "Create" : "Update"} Task`}
               </button>
            </div>
         </div>
      </div>
   );
};

export default ManageTab;