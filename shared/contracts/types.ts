export type User = {
  id: string;
  email: string;
  name: string;
  email_verified?: boolean;
};

export type Application = {
  id: string;
  company: string;
  title: string;
  status: string;
  location?: string;
  salary_range?: string;
  applied_at?: string | null;
  notes: string[];
  interview_date?: string | null;
  stage_history: Array<{ stage: string; timestamp: string }>;
};

export type Task = {
  id: string;
  title: string;
  application_id?: string | null;
  due_at?: string | null;
  completed?: boolean;
};

export type Contact = {
  id: string;
  application_id?: string | null;
  name: string;
  title?: string;
  email?: string;
};

export type Reminder = {
  id: string;
  title: string;
  application_id?: string | null;
  task_id?: string | null;
  scheduled_for: string;
  channel: "push" | "email";
};

