
export type GoalCategory = 'Health' | 'Career' | 'Personal';

export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id:string;
  title: string;
  description?: string;
  category: GoalCategory;
  deadline: string; // Stored as ISO string
  steps: Step[];
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
    id: string;
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

export type TravelGoalStatus = 'Completed' | 'Planned';

export interface TravelGoal {
  id: string;
  destination: string;
  status: TravelGoalStatus;
  travelDate: string | null; // Stored as ISO string
  notes?: string;
  image: string;
}

export type DailyTaskPriority = 'Low' | 'Medium' | 'High';
export type DailyTaskCategory = 'Work' | 'Personal' | 'Errands';

export interface DailyTask {
    id: string;
    title: string;
    description?: string;
    dueDate: string; // ISO string
    priority: DailyTaskPriority;
    category: DailyTaskCategory;
    completed: boolean;
}


export interface AppData {
    goals: Goal[];
    monthlyPlan: MonthlyPlan[];
    carSaleChecklist: ChecklistItem[];
    carSalePrice: string;
    carLoanPayoff: string;
    loans: Loan[];
    jobApplications: JobApplication[];
    emergencyFund: string;
    sipStarted: boolean;
    sipAmount: string;
    sipMutualFund: string;
    sipPlatform: string;
    travelGoals: TravelGoal[];
    dailyTasks: DailyTask[];
}
