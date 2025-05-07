"use server";

import { z } from "zod";
import { createSession, deleteSession } from "../../lib/session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// =========================================================== //
// Schemas

const loginSchema = z.object({
   email: z.string().email({ message: "Invalid email address" }).trim(),
   password: z.string().min(8, { message: "Password must be at least 8 characters" }).trim(),
});

const registerSchema = z
   .object({
      name: z.string().min(1, { message: "Name is required" }).trim(),
      email: z.string().email({ message: "Invalid email address" }).trim(),
      password: z
         .string()
         .min(8, { message: "Password must be at least 8 characters" })
         .trim(),
      confirmPassword: z
         .string()
         .min(8, { message: "Confirm password must be at least 8 characters" })
         .trim(),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
   });

// =========================================================== //

export async function login(prevState: any, formData: FormData) {
   const result = loginSchema.safeParse(Object.fromEntries(formData));

   if (!result.success) {
      return {
         errors: result.error.flatten().fieldErrors,
      };
   }

   const { email, password } = result.data;

   try {
      // Find the user in the database
      const user = await prisma.user.findUnique({
         where: { email },
      });

      if (!user) {
         return {
            errors: {
               error: ["Invalid email or password"],
            },
         };
      }

      // Compare the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!email || !passwordMatch) {
         return {
            errors: {
               error: ["Invalid email or password"],
            },
         };
      }

      // Create a session for the user
      await createSession(user.user_id, user.role);
      console.log("Session created successfully");
      return { success: true };

   } catch (error) {
      console.error("Login error:", error);
      return {
         errors: {
            error: ["An error occurred during login"],
         },
      };
   }
}

export async function register(prevState: any, formData: FormData) {
   const result = registerSchema.safeParse(Object.fromEntries(formData));

   if (!result.success) {
      return {
         errors: result.error.flatten().fieldErrors,
      };
   }

   const { name, email, password } = result.data;
   
   try {
      // Check if the user already exists
      const userExists = await prisma.user.findUnique({
         where: { email },
      });

      if (userExists) {
         return {
            errors: {
               email: ["User with this email already exists"],
            },
         };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user in the database
      const newUser = await prisma.user.create({
         data: {
            username: name,
            email,
            role: "Student",
            password_hash: hashedPassword,
            created_at: new Date(),
         },
      });

      // Create a session for the new user
      await createSession(newUser.user_id, newUser.role);

      return { success: true }

   } catch (error) {
      console.error("Registration error:", error);
      return {
         errors: {
            email: ["An error occurred during registration"],
         },
      };
   }
}

export async function logout() {
   await deleteSession();
   redirect("/login");
}