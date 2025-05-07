// app/dashboard/[classId]/page.tsx
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import ClassworkTab from "./ClassworkTab";
import { verifyTeacher } from "@/app/actions/classActions";

export default async function ClassPage({
   params,
}: {
   params: { classId: string };
}) {
   const session = await getSession();
   if (!session) redirect("/login");

   const classId = Number((await params).classId);
   let isTeacher = false;

   try {
      isTeacher = await verifyTeacher(classId, session.userId);
   } catch (error) {
      isTeacher = false;

   }

   return <ClassworkTab classId={classId} isTeacher={isTeacher} />;
}
