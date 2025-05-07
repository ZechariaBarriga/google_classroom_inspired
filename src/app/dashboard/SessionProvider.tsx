// app/providers/client-session-provider.tsx
"use client";

import { createContext, useContext } from "react";

type Session = {
   userId: number;
   role: string;
   expiresAt: Date;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, session }: { children: React.ReactNode; session: Session; }) {
   return (
      <SessionContext.Provider value={session}>
         {children}
      </SessionContext.Provider>
   );
}

export function useSession() {
   const context = useContext(SessionContext);
   if (!context) {
      throw new Error("useSession must be used within a SessionProvider");
   }
   return context;
}
