import { NextResponse, NextRequest } from "next/server";
import { getSession } from "./lib/session";

// const roleRoutes = {
//    Student: [
//       "/dashboard", // Student dashboard
//       "/profile", // Student profile
//       "/leaderboard", // View class leaderboard
//       "/tasks", // View assigned tasks
//       "/submissions", // View task submissions
//    ],
//    Teacher: [
//       "/dashboard", // Teacher dashboard
//       "/create-task", // Create new tasks
//       "/manage-class", // Manage class members and settings
//       "/rewards", // Manage rewards for students
//       "/leaderboard", // View class leaderboard
//       "/tasks", // View and manage tasks
//       "/submissions", // Grade student submissions
//    ],
//    Admin: [
//       "/dashboard", // Admin dashboard
//       "/admin", // Admin management panel
//       "/manage-users", // Manage users (e.g., promote/demote users)
//       "/manage-classes", // Manage all classes
//       "/rewards", // Manage rewards globally
//    ],
// };

const protectedRoutes = [
   "/dashboard", // General dashboard (role-specific content handled separately)
];

const publicRoutes = [
   "/", // Homepage
   "/login", // Login page
   "/register", // Registration page
];


export default async function middleware(req: NextRequest) {
   const path = req.nextUrl.pathname;
   const session = await getSession();

   const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
   const isPublicRoute = publicRoutes.includes(path);

   

   // Redirect unauthorized users trying to access protected routes
   if (isProtectedRoute && !session?.userId) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
   }

   // Redirect logged-in users trying to access public routes
   if (isPublicRoute && session?.userId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
   }

   // if (session?.userId && session.role) {
   //    const allowedRoutes = roleRoutes[session.role as keyof typeof roleRoutes] || [];
   //    const isAllowed = allowedRoutes.some((route) => path.startsWith(route));

   //    // If the user is trying to access a protected route they're not allowed to, redirect to unauthorized
   //    if (isProtectedRoute && !isAllowed) {
   //       return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
   //    }
   // }

   return NextResponse.next();
}