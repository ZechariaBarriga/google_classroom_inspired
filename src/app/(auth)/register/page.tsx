"use client";

import React, { useActionState, useEffect } from "react";
import { register } from "../actions";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

function RegisterPage() {
   const [state, registerAction, isPending] = useActionState(register, undefined);
   const router = useRouter();

   // Trigger toasts based on the state
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
         toast.success("Registration successful! Redirecting to dashboard...");

         router.push("/dashboard");
      }
   }, [state, router]);

   return (
      <div className={styles.container}>
         <div className={styles.card}>
            <h2 className={styles.title}>Create an Account</h2>
            <form className={styles.form} action={registerAction}>
               <div className="mt-2">
                  <label htmlFor="name" className={styles.label}>
                     Name
                  </label>
                  <input
                     id="name"
                     name="name"
                     placeholder="Enter your name*"
                     className={styles.input}
                     disabled={isPending}
                     required
                  />
               </div>
               <div className="mt-2">
                  <label htmlFor="email" className={styles.label}>
                     Email
                  </label>
                  <input
                     id="email"
                     name="email"
                     type="email"
                     disabled={isPending}
                     placeholder="Enter your email*"
                     className={styles.input}
                     required
                  />
               </div>
               {state?.errors?.email && (
                  <p className={styles.errorText}>
                     {state.errors.email.join(", ")}
                  </p>
               )}
               <div className="mt-2">
                  <label htmlFor="password" className={styles.label}>
                     Password
                  </label>
                  <input
                     id="password"
                     name="password"
                     type="password"
                     disabled={isPending}
                     placeholder="Enter your password*"
                     className={styles.input}
                     required
                  />
               </div>
               {state?.errors?.password && (
                  <p className={styles.errorText}>
                     {state.errors.password.join(", ")}
                  </p>
               )}
               <div className="mt-4">
                  <label htmlFor="confirmPassword" className={styles.label}>
                     Confirm Password
                  </label>
                  <input
                     id="confirmPassword"
                     name="confirmPassword"
                     type="password"
                     disabled={isPending}
                     placeholder="Confirm your password*"
                     className={styles.input}
                     required
                  />
               </div>
               {state?.errors?.confirmPassword && (
                  <p className={styles.errorText}>
                     {state.errors.confirmPassword.join(", ")}
                  </p>
               )}
               <button
                  type="submit"
                  disabled={isPending}
                  className={styles.button}
               >
                  {isPending ? "Registering..." : "Register"}
               </button>
            </form>
            <p className={styles.loginText}>
               Already have an account?{" "}
               <Link href="/login" className={styles.loginLink}>
                  Login here
               </Link>
            </p>
         </div>
      </div>
   );
}

const styles = {
   container:
      "flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 font-sans",
   card: "w-full max-w-md p-8 bg-white shadow-lg rounded-2xl transform transition-transform duration-500 hover:scale-105",
   title: "text-4xl font-medium text-center font-semibold mb-6 text-blue-600",
   errorText: "text-red-500 text-center text-[14px]",
   form: "flex flex-col gap-2",
   label: "block text-gray-800",
   input: "w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:border-blue-500",
   button:
      "w-full py-3 px-6 bg-blue-500 text-white mt-6 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
   loginText: "text-center mt-4 text-gray-700",
   loginLink: "text-blue-500 hover:underline",
};

export default RegisterPage;
