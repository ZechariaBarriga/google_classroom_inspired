"use client";

import Link from "next/link";
import { TaskType } from "@/utils/classUtils";
import { useClasses } from "../ClassesProvider";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteTask, getSubmissions, getUserSubmissions } from "@/app/actions/taskActions";
import { useRouter } from "next/navigation";
import { useSession } from "../SessionProvider";
import { SubmissionWithUser } from "./[taskId]/submissions/SubmissionsPage";

interface Props {
   classId: number;
   isTeacher?: boolean;
}

interface TaskWithSubmissions extends TaskType {
   submissions?: SubmissionWithUser[];
}

const TaskList = ({ classId, isTeacher }: Props) => {
   const { classes } = useClasses();
   const { userId } = useSession()
   const current = classes.find((c) => c.class_id === classId);
   const [tasks, setTasks] = useState<TaskWithSubmissions[]>([]);
   const router = useRouter();

   if (!current) {
      return notFound();
   }
   

     useEffect(() => {
        if (current) {
           // First set the tasks
           const tasksWithSubmissions = [...current.tasks];
           setTasks(tasksWithSubmissions);

           // Then fetch submissions for each task
           const fetchSubmissions = async () => {
              const updatedTasks = await Promise.all(
                 tasksWithSubmissions.map(async (task) => {
                    try {
                       const taskSubmissions = isTeacher
                          ? await getSubmissions(classId, task.task_id, userId)
                          : await getUserSubmissions(task.task_id, userId);
                       return { ...task, submissions: taskSubmissions };
                    } catch (error) {
                       console.error(
                          `Error fetching submissions for task ${task.task_id}:`,
                          error
                       );
                       return task; // Return task without submissions if fetch fails
                    }
                 })
              );
              setTasks(updatedTasks);
           };

           fetchSubmissions();
        }
     }, [current.tasks, classId, userId, isTeacher]);


   if (tasks.length === 0) {
      return (
         <div className="p-6 text-center text-gray-500">
            No tasks assigned yet
         </div>
      );
   }
   const handleDeleteTask = async (taskId: number) => {
      try {
         await deleteTask(taskId, classId, userId);
         setTasks((prevTasks) =>
            prevTasks.filter((task) => task.task_id !== taskId)
         );
      } catch (error) {
         console.error("Error deleting task:", error);
         alert("Failed to delete task");
      }
   };

   const handleEditTask = (taskId: number) => {
      router.push(`/dashboard/${classId}/${taskId}/edit`);
   }

   
   return (
      <div className="space-y-4">
         {tasks.map((task) => (
            <div key={task.task_id} className="relative">
               <Link
                  href={
                     isTeacher
                        ? `/dashboard/${classId}/${task.task_id}/submissions`
                        : `/dashboard/${classId}/${task.task_id}`
                  }
                  className="block border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
               >
                  <div className="flex justify-between items-start text-gray-600">
                     <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                           {task.task_title}
                        </h3>
                        {!isTeacher &&
                           task.submissions?.some(
                              (s) => s.user_id === userId && s.is_graded
                           ) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 Graded
                              </span>
                           )}
                     </div>
                     <div className="text-sm">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                     </div>
                  </div>

                  <div className="flex gap-2 text-sm text-gray-600 mt-1">
                     <p>
                        {task.questions.length} questions • {task.total_points}{" "}
                        points
                     </p>
                  </div>

                  {isTeacher && (
                     <p>
                        {task.submissions && (
                           <span className="text-sm text-blue-500">
                              {task.submissions.length} submission{task.submissions.length !== 1 ? "s" : ""},{" "}
                              {task.submissions.filter((s) => s.is_graded).length}{" "}graded
                           </span>
                        )}
                     </p>
                  )}
               </Link>

               {isTeacher && (
                  <div className="flex space-x-4 mt-2 float-right relative bottom-12 z-10">
                     <button
                        onClick={() => handleEditTask(task.task_id)}
                        className="text-blue-500 hover:text-blue-700"
                     >
                        Edit
                     </button>
                     <button
                        onClick={() => handleDeleteTask(task.task_id)}
                        className="text-red-500 hover:text-red-700 pr-4"
                     >
                        Delete
                     </button>
                  </div>
               )}
            </div>
         ))}
      </div>
   );
};

export default TaskList;
