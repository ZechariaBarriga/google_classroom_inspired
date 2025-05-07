// app/dashboard/layout.tsx
"use server"
import Sidebar from "@/components/Sidebar";
import { ClassesProvider } from "./ClassesProvider";
import { fetchClasses } from "../actions/classActions";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SessionProvider } from "./SessionProvider";

export default async function Layout({ children }: { children: React.ReactNode }) {
   const session = await getSession();
   const classes = session ? await fetchClasses(session.userId) : [];

   if (!session) {
      redirect("/login");
   }

   const safeSession = {
      userId: session.userId,
      role: session.role,
      expiresAt: session.expiresAt,
   };

   return (
      <SessionProvider session={safeSession}>
         <ClassesProvider initialClasses={classes}>
            <div className="min-h-screen flex">
               <Sidebar />
               <div className="flex-1">{children}</div>
            </div>
         </ClassesProvider>
      </SessionProvider>
   );
}
