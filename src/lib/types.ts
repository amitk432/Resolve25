export type GoalStatus = 'To Do' | 'In Progress' | 'Done';

export interface Goal {
  category: string;
  goal: string;
  target: string;
  status: GoalStatus;
}

export interface MonthlyTask {
  text: string;
  done: boolean;
}

export interface MonthlyPlan {
  month: string;
  theme: string;
  tasks: MonthlyTask[];
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export type LoanStatus = 'Active' | 'Closed';

export interface Loan {
  name: string;
  principal: string;
  status: LoanStatus;
}

export type JobStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface JobApplication {
  date: string;
  company: string;
  role: string;
  status: JobStatus;
}

export interface AppData {
  goals: Goal[];
  monthlyPlan: MonthlyPlan[];
  carSaleChecklist: ChecklistItem[];
  loans: Loan[];
  emergencyFund: string;
  sipStarted: boolean;
  jobApplications: JobApplication[];
}
