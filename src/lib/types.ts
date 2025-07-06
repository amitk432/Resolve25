
export type GoalStatus = 'To Do' | 'In Progress' | 'Done';

export interface Goal {
    category: string;
    goal: string;
    target: string;
    status: GoalStatus;
}

export interface Task {
    text: string;
    done: boolean;
}

export interface MonthlyPlan {
    month: string;
    theme: string;
    tasks: Task[];
}

export interface ChecklistItem {
    text: string;
    done: boolean;
}

export type LoanStatus = 'Active' | 'Closed';

export interface Loan {
    id: string;
    name: string;
    principal: string;
    status: LoanStatus;
}

export type JobStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface JobApplication {
    date: string; // YYYY-MM-DD
    company: string;
    role: string;
    status: JobStatus;
}

export interface AppData {
    goals: Goal[];
    monthlyPlan: MonthlyPlan[];
    carSaleChecklist: ChecklistItem[];
    loans: Loan[];
    jobApplications: JobApplication[];
    emergencyFund: string;
    sipStarted: boolean;
    sipSourceOfFunds: string;
    sipPlatform: string;
}
