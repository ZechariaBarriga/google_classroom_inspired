"use client";

import ClassModal from "@/components/ClassModal";
import {
   createClass,
   joinClass,
   unenrollClass,
   dissolveClass,
} from "@/app/actions/classActions";
import ClassCard from "@/components/ClassCard";
import { useState, useEffect } from "react";
import { logout } from "../(auth)/actions";
import { useRouter } from "next/navigation";
import { useClasses } from "./ClassesProvider";
import { useSession } from "./SessionProvider";

function Dashboard() {
   const [showModal, setShowModal] = useState(false);
   const { userId } = useSession();
   const [modalType, setModalType] = useState<"join" | "create" | null>(null);
   const [dropdownOpen, setDropdownOpen] = useState(false);
   const router = useRouter();
   const { classes, setClasses } = useClasses();

   const handleJoinClass = async (classCode: string) => {
      try {
         const joinedClass = await joinClass(classCode, userId);
         setClasses((prev) => [...prev, joinedClass]);
         setShowModal(false);
      } catch (error) {
         console.error("Failed to join class:", error);
      }
   };

   const handleCreateClass = async (classData: {
      className: string;
      section?: string;
      subject?: string;
      room?: string;
   }) => {
      try {
         const newClass = await createClass(classData, userId);
         setClasses((prev) => [...prev, newClass]);
         setShowModal(false);
      } catch (error) {
         console.error("Failed to create class:", error);
      }
   };

   return (
      <div className="flex min-h-screen bg-white flex-col">
         <header>
            <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-medium text-gray-800">Classes</h1>
               <div className="relative">
                  <button
                     onClick={() => setDropdownOpen(!dropdownOpen)}
                     className="p-2 hover:bg-gray-100 rounded-full"
                  >
                     ➕
                  </button>
                  <button onClick={logout}>Logout</button>
                  {dropdownOpen && (
                     <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden">
                        <button
                           onClick={() => {
                              setModalType("join");
                              setShowModal(true);
                              setDropdownOpen(false);
                           }}
                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                           Join Class
                        </button>
                        <button
                           onClick={() => {
                              setModalType("create");
                              setShowModal(true);
                              setDropdownOpen(false);
                           }}
                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                           Create Class
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </header>
         <main className="flex-1 p-6 ">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
               {classes.map((classItem) => {
                  const isTeacher = classItem.created_by === userId;
                  return (
                     <ClassCard
                        classId={classItem.class_id}
                        key={classItem.class_id}
                        title={classItem.class_name}
                        subtitle={classItem.subject || ""}
                        teacher={classItem.createdBy.username}
                        color="bg-blue-500"
                        avatarLetter={classItem.class_name[0].toUpperCase()}
                        isTeacher={isTeacher}
                        onUnenroll={async () => {
                           try {
                              await unenrollClass(classItem.class_id, userId);
                              
                              setClasses(
                                 classes.filter(
                                    (c) => c.class_id !== classItem.class_id
                                 )
                              );
                              router.push("/dashboard");
                           } catch (error) {
                              console.error("Failed to unenroll:", error);
                           }
                        }}
                        onDissolve={async () => {
                           try {
                              await dissolveClass(classItem.class_id, userId);
                              setClasses(
                                 classes.filter(
                                    (c) => c.class_id !== classItem.class_id
                                 )
                              );
                              router.push("/dashboard");
                           } catch (error) {
                              console.error("Failed to dissolve class:", error);
                           }
                        }}
                     />
                  );
               })}
            </div>
         </main>

         {showModal && modalType === "join" && (
            <ClassModal onClose={() => setShowModal(false)}>
               <h2 className="text-xl font-semibold">Join Class</h2>
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     const classCode = (e.target as HTMLFormElement).classCode
                        .value;
                     handleJoinClass(classCode);
                  }}
               >
                  <input
                     type="text"
                     name="classCode"
                     placeholder="Class Code"
                     className="border p-2 rounded w-full"
                     required
                  />
                  <button
                     type="submit"
                     className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                     Join
                  </button>
               </form>
            </ClassModal>
         )}

         {showModal && modalType === "create" && (
            <ClassModal onClose={() => setShowModal(false)}>
               <h2 className="text-xl font-semibold">Create Class</h2>
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.target as HTMLFormElement);
                     handleCreateClass({
                        className: formData.get("className")?.toString() || "",
                        section:
                           formData.get("section")?.toString() || undefined,
                        subject:
                           formData.get("subject")?.toString() || undefined,
                        room: formData.get("room")?.toString() || undefined,
                     });
                  }}
               >
                  <input
                     type="text"
                     name="className"
                     placeholder="Class Name (Required)"
                     className="border p-2 rounded w-full"
                     required
                  />
                  <input
                     type="text"
                     name="section"
                     placeholder="Section"
                     className="border p-2 rounded w-full mt-2"
                  />
                  <input
                     type="text"
                     name="subject"
                     placeholder="Subject"
                     className="border p-2 rounded w-full mt-2"
                  />
                  <input
                     type="text"
                     name="room"
                     placeholder="Room"
                     className="border p-2 rounded w-full mt-2"
                  />
                  <button
                     type="submit"
                     className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                     Create
                  </button>
               </form>
            </ClassModal>
         )}
      </div>
   );
}

export default Dashboard;
