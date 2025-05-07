"use client";

import React, { useActionState, useEffect } from "react";
import { login } from "../actions";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

function LoginPage() {
   const [state, loginAction, isPending] = useActionState(login, undefined);
   const router = useRouter();

   useEffect(() => {
      if (state?.errors) {
         // Display error toasts for each error field
         Object.entries(state.errors).forEach(([field, messages]) => {
            messages.forEach((message: string) => {
               toast.error(`${field}: ${message}`);
            });
         });
      } else if (state?.success) {
         // Display success toast
         toast.success("Login successful!");

         router.push("/dashboard");
      }
   }, [state, router]);
   
   return (
      <div className={styles.container}>
         <div className={styles.card}>
            <h2 className={styles.title}>Welcome Back</h2>
            <form className={styles.form} action={loginAction}>
               <div className="mt-2">
                  <label htmlFor="email" className={styles.label}>
                     Email
                  </label>
                  <input
                     id="email"
                     name="email"
                     type="email"
                     placeholder="Enter your email*"
                     className={styles.input}
                     disabled={isPending}
                     required
                  />
               </div>
               <div className="mt-2">
                  <label htmlFor="password" className={styles.label}>
                     Password
                  </label>
                  <input
                     id="password"
                     name="password"
                     type="password"
                     placeholder="Enter your password*"
                     className={styles.input}
                     disabled={isPending}
                     required
                  />
               </div>
               {state?.errors && (
                  <div className={styles.errorText}>
                     Invalid email and password
                  </div>
               )}
               <button
                  type="submit"
                  disabled={isPending}
                  className={styles.button}
               >
                  {isPending ? "Logging in..." : "Login"}
               </button>
            </form>

            <p className={styles.registerText}>
               Don't have an account?{" "}
               <Link href="/register" className={styles.registerLink}>
                  Register now!
               </Link>
            </p>
         </div>
      </div>
   );
}

const styles = {
   container: "flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 font-sans",
   card: "w-full max-w-md p-8 bg-white shadow-lg rounded-2xl transform transition-transform duration-500 hover:scale-105",
   title: "text-4xl font-medium text-center font-semibold mb-6 text-blue-600",
   errorText: "text-red-500 text-center text-[15px]",
   form: "flex flex-col gap-2",
   label: "block text-gray-800",
   input: "w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:border-blue-500",
   button: "w-full py-3 px-6 bg-blue-500 text-white mt-6 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
   registerText: "text-center mt-4 text-gray-700",
   registerLink: "text-blue-500 hover:underline",
};

export default LoginPage;
