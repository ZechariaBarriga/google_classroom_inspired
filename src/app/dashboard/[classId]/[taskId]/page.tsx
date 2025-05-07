// app/dashboard/[classId]/page.tsx
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TaskDetail from "./TaskDetail";

export default async function TaskListPage({
   params,
}: {
   params: { classId: string, taskId: string };
}) {
   const session = await getSession();
   if (!session) redirect("/login");
   const classId = Number((await params).classId);
   const taskId = Number((await params).classId);
   
   return <TaskDetail classId={classId} taskId={taskId} />;
}
