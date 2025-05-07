// app/dashboard/classes-provider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ClassType } from "@/utils/classUtils";
import { fetchClasses } from "../actions/classActions";
import { useSession } from "./SessionProvider";

type ClassesContextType = {
   classes: ClassType[];
   setClasses: React.Dispatch<React.SetStateAction<ClassType[]>>;
   refreshClasses: () => Promise<void>;
};

const ClassesContext = createContext<ClassesContextType | undefined>(undefined);

export function ClassesProvider({ children, initialClasses }: { children: ReactNode;  initialClasses: ClassType[] }) {
   const [classes, setClasses] = useState<ClassType[]>(initialClasses);
   const { userId } = useSession();
   
   const refreshClasses = async () => {
      const response = await fetchClasses(userId);
      setClasses(response);
   };

   return (
      <ClassesContext.Provider value={{ classes, setClasses, refreshClasses }}>
         {children}
      </ClassesContext.Provider>
   );
}

export function useClasses() {
   const context = useContext(ClassesContext);
   if (!context) {
      throw new Error("useClasses must be used within a ClassesProvider");
   }
   return context;
}
