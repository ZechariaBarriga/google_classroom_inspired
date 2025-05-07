"use server"

// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma"
import { ClassType } from "@/utils/classUtils"

export async function verifyTeacher(
   classId: number,
   userId: number
): Promise<boolean> {
   const membership = await prisma.classMembership.findUnique({
      where: { class_id_user_id: { class_id: classId, user_id: userId } },
      select: { role: true },
   })

   if (!membership || membership.role !== "Teacher") {
      throw new Error("Unauthorized access")
   }
   return true
}

export async function fetchClasses(userId: number): Promise<ClassType[]> {
   try {
      const classes = await prisma.class.findMany({
         where: { members: { some: { user_id: userId } } },
         select: {
            class_id: true,
            class_name: true,
            class_code: true,
            section: true,
            subject: true,
            room: true,
            created_by: true,
            created_at: true,
            createdBy: { select: { user_id: true, username: true } },
            members: {
               select: {
                  class_id: true,
                  user_id: true,
                  role: true,
                  user: { select: { user_id: true, username: true } },
               },
            },
            tasks: {
               select: {
                  task_id: true,
                  task_title: true,
                  task_description: true,
                  start_date: true,
                  deadline: true,
                  total_points: true,
                  max_attempts: true,
                  status: true,
                  created_at: true,
                  questions: {
                     select: {
                        question_id: true,
                        question_type: true,
                        question_text: true,
                        points: true,
                        mcq_question: { select: { choices: true } },
                        essay_question: { select: { guidelines: true } },
                     },
                     orderBy: { question_id: "asc" },
                  },
               },
            },
            leaderboard: {
               select: {
                  class_id: true,
                  user_id: true,
                  total_points: true,
                  last_updated: true,
               },
            },
         },
      })

      return classes as ClassType[]
   } catch (error) {
      console.error("Error fetching classes:", error)
      throw new Error("Failed to fetch classes")
   }
}

export async function createClass(
   classData: {
      className: string
      section?: string
      subject?: string
      room?: string
   },
   userId: number
): Promise<ClassType> {
   const classCode = `${classData.className
      .substring(0, 2)
      .toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`

   try {
      const newClass = await prisma.class.create({
         data: {
            class_name: classData.className,
            class_code: classCode,
            section: classData.section,
            subject: classData.subject,
            room: classData.room,
            created_by: userId,
            members: { create: { user_id: userId, role: "Teacher" } },
            leaderboard: { create: { user_id: userId, total_points: 0 } },
         },
         select: {
            class_id: true,
            class_name: true,
            class_code: true,
            section: true,
            subject: true,
            room: true,
            created_by: true,
            created_at: true,
            createdBy: { select: { user_id: true, username: true } },
            members: {
               select: {
                  class_id: true,
                  user_id: true,
                  role: true,
                  user: { select: { user_id: true, username: true } },
               },
            },
            tasks: { select: { task_id: true } }, // Only include minimal task data
            leaderboard: { where: { user_id: userId } },
         },
      })

      return newClass as ClassType
   } catch (error) {
      console.error("Error creating class:", error)
      throw new Error("Failed to create class")
   }
}

export async function joinClass(
   classCode: string,
   userId: number
): Promise<ClassType> {
   try {
      const classToJoin = await prisma.class.findUnique({
         where: { class_code: classCode },
         select: {
            class_id: true,
            class_name: true,
            class_code: true,
            section: true,
            subject: true,
            room: true,
            created_by: true,
            created_at: true,
            createdBy: { select: { user_id: true, username: true } },
            members: {
               select: {
                  class_id: true,
                  user_id: true,
                  role: true,
                  user: { select: { user_id: true, username: true } },
               },
            },
            tasks: { select: { task_id: true } },
            leaderboard: true,
         },
      })

      if (!classToJoin) throw new Error("Class not found")
      if (classToJoin.members.some((m) => m.user_id === userId)) {
         throw new Error("Already a member")
      }

      await prisma.$transaction([
         prisma.classMembership.create({
            data: {
               class_id: classToJoin.class_id,
               user_id: userId,
               role: "Student",
            },
         }),
         prisma.leaderboard.create({
            data: {
               class_id: classToJoin.class_id,
               user_id: userId,
               total_points: 0,
            },
         }),
      ])

      const newUser = await prisma.user.findUnique({
         where: { user_id: userId },
         select: { user_id: true, username: true },
      })

      return {
         ...classToJoin,
         members: [
            ...classToJoin.members,
            {
               class_id: classToJoin.class_id,
               user_id: userId,
               role: "Student",
               user: newUser!,
            },
         ],
         leaderboard: [
            ...classToJoin.leaderboard,
            {
               class_id: classToJoin.class_id,
               user_id: userId,
               total_points: 0,
               last_updated: new Date(),
            },
         ],
      } as ClassType
   } catch (error) {
      console.error("Error joining class:", error)
      throw error instanceof Error ? error : new Error("Failed to join class")
   }
}

export async function unenrollClass(
   classId: number,
   userId: number
): Promise<void> {
   try {
      await prisma.$transaction([
         prisma.classMembership.delete({
            where: { class_id_user_id: { class_id: classId, user_id: userId } },
         }),
         prisma.leaderboard.delete({
            where: { class_id_user_id: { class_id: classId, user_id: userId } },
         }),
      ])
   } catch (error) {
      console.error("Error unenrolling from class:", error)
      throw new Error("Failed to unenroll")
   }
}

export async function dissolveClass(
   classId: number,
   userId: number
): Promise<void> {
   try {
      await verifyTeacher(classId, userId)

      await prisma.$transaction([
         prisma.submission.deleteMany({
            where: { task: { class_id: classId } },
         }),
         prisma.task.deleteMany({ where: { class_id: classId } }),
         prisma.leaderboard.deleteMany({ where: { class_id: classId } }),
         prisma.classMembership.deleteMany({ where: { class_id: classId } }),
         prisma.class.delete({ where: { class_id: classId } }),
      ])
   } catch (error) {
      console.error("Error dissolving class:", error)
      throw error instanceof Error
         ? error
         : new Error("Failed to dissolve class")
   }
}
