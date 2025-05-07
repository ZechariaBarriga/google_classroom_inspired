"use client";

import { useEffect, useState } from "react";
import ManageTab from "./ManageTab";
import PeopleTab from "./PeopleTab";
import TaskList from "./TaskList";
import { useClasses } from "../ClassesProvider";
import { notFound, useRouter } from "next/navigation";
import { getSubmissions } from "@/app/actions/taskActions";
import Leaderboards from "./Leaderboards";

interface TabProps {
   classId: number;
   isTeacher: boolean;
}

function ClassworkTab({ classId, isTeacher }: TabProps) {
   const [activeTab, setActiveTab] = useState("classwork");
   const { classes } = useClasses();
   const current = classes.find((c) => c.class_id === classId);

   
   if (!current) {
      return notFound();
   }  

   return (
      <div className="min-h-screen bg-white flex flex-col">
         {/* Header Section */}
         <div className="h-40 bg-blue-500 text-white p-6 flex flex-col justify-end">
            <h1 className="text-3xl font-bold">{current?.class_name}</h1>
            <p className="opacity-90">{current?.section}</p>
         </div>

         {/* Tabs */}
         <div className="border-b border-gray-300 flex">
            <button
               className={`px-6 py-3 text-lg font-medium ${
                  activeTab === "classwork"
                     ? "border-b-2 border-blue-500 text-blue-600"
                     : "text-gray-600"
               }`}
               onClick={() => setActiveTab("classwork")}
            >
               Classwork
            </button>
            <button
               className={`px-6 py-3 text-lg font-medium ${
                  activeTab === "people"
                     ? "border-b-2 border-blue-500 text-blue-600"
                     : "text-gray-600"
               }`}
               onClick={() => setActiveTab("people")}
            >
               People
            </button>
            <button
               className={`px-6 py-3 text-lg font-medium ${
                  activeTab === "leaderboards"
                     ? "border-b-2 border-blue-500 text-blue-600"
                     : "text-gray-600"
               }`}
               onClick={() => setActiveTab("leaderboards")}
            >
               Leaderboards
            </button>
            {isTeacher && (
               <button
                  className={`px-6 py-3 text-lg font-medium ${
                     activeTab === "manage"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-600"
                  }`}
                  onClick={() => setActiveTab("manage")}
               >
                  Manage Classwork
               </button>
            )}
         </div>

         {/* Content */}
         <div className="p-6">
            {activeTab === "classwork" && (
               <TaskList classId={classId} isTeacher={isTeacher} />
            )}

            {activeTab === "people" && <PeopleTab current={current} />}
            {activeTab === "leaderboards" && <Leaderboards current={current} />}
            {isTeacher && activeTab === "manage" && (
               <ManageTab
                  classId={classId}
                  mode="create"
                  onSuccess={() => setActiveTab("classwork")}
               />
            )}
         </div>
      </div>
   );
}

export default ClassworkTab;
