"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useClasses } from "@/app/dashboard/ClassesProvider";
import { useRouter, usePathname } from "next/navigation";


const Menu = dynamic(() => import("lucide-react").then((mod) => mod.Menu));
const Home = dynamic(() => import("lucide-react").then((mod) => mod.Home));
const BookOpen = dynamic(() => import("lucide-react").then((mod) => mod.BookOpen));
const Archive = dynamic(() => import("lucide-react").then((mod) => mod.Archive));
const Settings = dynamic(() => import("lucide-react").then((mod) => mod.Settings));
const ChevronDown = dynamic(() => import("lucide-react").then((mod) => mod.ChevronDown));

type NavItem = {
   icon: React.ReactNode;
   label: string;
   active?: boolean;
   path?: string;
   subtext?: string;
   isExpandable?: boolean;
   onClick?: () => void;
   children?: React.ReactNode;
};

interface SidebarProps {
   onToggle?: (collapsed: boolean) => void;
}



const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
   const [isCollapsed, setIsCollapsed] = useState(false);
   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
      enrolled: false,
   });
   const { classes } = useClasses();
   const router = useRouter();
   const pathname = usePathname();

   const handleNavigation = (path?: string) => {
      if (path) router.push(path);
   };

   const toggleSidebar = () => {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      onToggle?.(newState);
   };

   const navItems: NavItem[] = [
      { icon: <Home className="w-5 h-5" />, label: "Home", path: "/dashboard" },
      // {
      //    icon: <Calendar className="w-5 h-5" />,
      //    label: "Calendar",
      //    active: false,
      // },
      {
         icon: <BookOpen className="w-5 h-5" />,
         label: "Enrolled",
         isExpandable: true,
         children: (
            <div className="mr-2 ml-2">
               {classes.map((classItem) => (
                  <Link
                     key={classItem.class_id}
                     href={`/dashboard/${classItem.class_id}`}
                     className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition rounded-lg"
                  >
                     <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                        {classItem.class_name[0].toUpperCase()}
                     </div>
                     <div>
                        <div className="font-medium">
                           {classItem.class_name}
                        </div>
                        <div className="text-xs text-gray-500">
                           {classItem.section}
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         ),
      },
      { icon: <Archive className="w-5 h-5" />, label: "Archived classes" },
      { icon: <Settings className="w-5 h-5" />, label: "Settings" },
   ];

   return (
      <div
         className={`${
            isCollapsed ? "w-19" : "w-64"
         } min-h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-md`}
      >
         {/* Sidebar header */}
         <div className="flex items-center p-4 border-b border-gray-200">
            <button
               className="p-2 hover:bg-gray-200 rounded-full transition"
               onClick={toggleSidebar}
            >
               <Menu className="h-6 w-6 text-gray-600" />
            </button>
            {!isCollapsed && (
               <Link href="/dashboard" className="flex items-center ml-2">
                  <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                     >
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.328.996.002 1.069c0 .537.12 1.045.34 1.5.217.454.518.833.884 1.12.366.288.786.499 1.258.634.472.135.98.204 1.525.204s1.052-.069 1.525-.204c.472-.135.892-.346 1.258-.634.366-.287.667-.666.884-1.12.22-.455.34-.963.34-1.5v-1.431l3.266-1.4a1 1 0 000-1.839l-7-3z" />
                     </svg>
                  </div>
                  <span className="ml-2 text-xl font-semibold text-gray-800">
                     Classroom
                  </span>
               </Link>
            )}
         </div>

         {/* Navigation items */}
         <nav className="flex-1 pt-2 overflow-y-auto">
            <ul className="space-y-1">
               {navItems.map((item, index) => (
                  <li key={index}>
                     <div className="flex flex-col">
                        <button
                           onClick={() =>
                              item.isExpandable
                                 ? setExpandedItems((prev) => ({
                                      ...prev,
                                      [item.label]: !prev[item.label],
                                   }))
                                 : handleNavigation(item.path)
                           }
                           className={`flex items-center px-4 py-3 w-full text-left transition ${
                              pathname === item.path
                                 ? "bg-blue-50 text-gray-700"
                                 : "text-gray-700 hover:bg-gray-200"
                           } rounded-lg`}
                        >
                           <span className="mr-3">{item.icon}</span>
                           {!isCollapsed && (
                              <>
                                 <span className="font-medium flex-1">
                                    {item.label}
                                 </span>
                                 {item.isExpandable && (
                                    <ChevronDown
                                       className={`w-4 h-4 transition-transform ${
                                          expandedItems[item.label]
                                             ? "rotate-180"
                                             : ""
                                       }`}
                                    />
                                 )}
                              </>
                           )}
                        </button>
                        {!isCollapsed &&
                           item.isExpandable &&
                           expandedItems[item.label] &&
                           item.children}
                     </div>
                  </li>
               ))}
            </ul>
         </nav>
      </div>
   );
};

export default Sidebar;
