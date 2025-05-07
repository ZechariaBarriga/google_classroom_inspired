// app/dashboard/[classId]/[taskId]/edit/page.tsx
import ManageTab from "../../ManageTab";

export default async function EditTaskPage({
   params,
}: {
   params: { classId: string; taskId: string };
}) {
   const classId = Number((await params).classId);
   const taskId = Number((await params).taskId);
   

   return <ManageTab classId={classId} mode="edit" taskId={taskId} />;
}
