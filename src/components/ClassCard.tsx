

// components/ClassCard.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MoreVertical = dynamic(() => import("lucide-react").then((mod) => mod.MoreVertical), { ssr: false });
const Users = dynamic(() => import("lucide-react").then((mod) => mod.Users), { ssr: false });
const Folder = dynamic(() => import("lucide-react").then((mod) => mod.Folder), { ssr: false });
const Trash2 = dynamic(() => import("lucide-react").then((mod) => mod.Trash2), { ssr: false });
const LogOut = dynamic(() => import("lucide-react").then((mod) => mod.LogOut), { ssr: false });


type ClassCardProps = {
   classId: number;
   title: string;
   subtitle: string;
   teacher: string;
   color: string;
   avatarLetter: string;
   isTeacher: boolean;
   onUnenroll?: () => void;
   onDissolve?: () => void;
};

const ClassCard: React.FC<ClassCardProps> = ({
   classId,
   title,
   subtitle,
   teacher,
   color,
   avatarLetter,
   isTeacher,
   onUnenroll,
   onDissolve,
}) => {
   const [showDropdown, setShowDropdown] = useState(false);
   const router = useRouter();
   
   const handleAction = async (action: "unenroll" | "dissolve") => {
      try {
         if (action === "unenroll" && onUnenroll) {
            onUnenroll();
         } else if (action === "dissolve" && onDissolve) {
            onDissolve();
         }
      } catch (error) {
         console.error(`Error during ${action}:`, error);
      } finally {
         setShowDropdown(false);
      }
   };


   return (
      <div className="rounded-lg shadow-sm overflow-hidden border border-gray-200 w-full h-[250px] flex flex-col relative">
         {/* Top Section */}
         <div
            className={`h-28 p-4 flex justify-between items-start ${color}`}
            onClick={() => router.push(`/dashboard/${classId}`)}
         >
            <div>
               <h3 className="text-white text-xl font-medium">{title}</h3>
               <p className="text-white text-sm opacity-90">{subtitle}</p>
               <p className="text-white text-sm mt-1">{teacher}</p>
            </div>
            <div className="relative">
               <button
                  className="text-white p-1 rounded-full hover:bg-gray-500/20"
                  onClick={(event) => {
                     event.stopPropagation(); // Prevents click from bubbling to parent
                     setShowDropdown((prev) => !prev);
                  }}
               >
                  <MoreVertical className="w-6 h-6" />
               </button>

               {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                     <div className="py-1">
                        {isTeacher ? (
                           <button
                              onClick={() => handleAction("dissolve")}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                           >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Dissolve class
                           </button>
                        ) : (
                           <button
                              onClick={() => handleAction("unenroll")}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                           >
                              <LogOut className="w-4 h-4 mr-2" />
                              Unenroll
                           </button>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Avatar & Bottom Buttons */}
         <div className="relative bg-white flex flex-col items-center mt-auto">
            {/* Avatar */}
            <div className="absolute -top-24 right-4">
               <div className="w-16 h-16 rounded-full bg-gray-700 text-white flex items-center justify-center text-xl font-medium border-2 border-white">
                  {avatarLetter}
               </div>
            </div>

            {/* Bottom Buttons */}
            <div className="w-full flex justify-around p-4">
               <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Users className="w-5 h-5 text-gray-700" />
               </button>
               <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Folder className="w-5 h-5 text-gray-700" />
               </button>
            </div>
         </div>
      </div>
   );
};

export default ClassCard;
