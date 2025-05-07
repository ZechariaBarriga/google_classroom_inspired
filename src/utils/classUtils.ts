import { JsonValue } from "@prisma/client/runtime/library";

export type SubmissionType = {
   submission_id: number;
   task_id: number;
   user_id: number;
   attempt_number: number;
   submission_data: JsonValue;
   submission_time: Date;
   points_earned?: number | null;
   is_graded: boolean | null;
   graded_by?: number | null;
   task?: {
      task_title: string;
      max_attempts: number;
   };
};


// Base user type (used across multiple relations)
export type UserBasic = {
   user_id: number;
   username: string;
};

// Membership types
type ClassMember = {
   class_id: number;
   user_id: number;
   role: string;
   user: UserBasic;
};

// Question types
type BaseQuestion = {
   question_id: number;
   question_type: "MCQ" | "Essay";
   question_text: string;
   points: number;
};

type MCQQuestion = BaseQuestion & {
   question_type: "MCQ";
   mcq_question: {
      choices: string[];
   };
};

type EssayQuestion = BaseQuestion & {
   question_type: "Essay";
   essay_question: {
      guidelines: string | null;
   };
};

type QuestionType = MCQQuestion | EssayQuestion;

// Task type
export type TaskType = {
   task_id: number;
   task_title: string;
   task_description?: string | null;
   start_date: Date;
   deadline: Date;
   total_points: number;
   max_attempts: number;
   status: string;
   created_at: Date;
   questions: QuestionType[];
};

// Leaderboard type
export type LeaderboardEntry = {
   class_id: number;
   user_id: number;
   total_points: number;
   last_updated: Date;
};

// Main Class type
export type ClassType = {
   class_id: number;
   class_name: string;
   class_code: string;
   section?: string | null;
   subject?: string | null;
   room?: string | null;
   created_by: number;
   created_at: Date;
   createdBy: UserBasic;
   members: ClassMember[];
   tasks: TaskType[];
   leaderboard?: LeaderboardEntry[];
};