
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
    id:string;
    text: string;
    done: boolean;
}

export type LoanStatus = 'Active' | 'Closed';

export interface Loan {
    id:string;
    name: string;
    principal: string;
    rate?: string; // Annual interest rate in %
    tenure?: string; // Tenure in months
    emisPaid?: string; // Number of EMIs already paid
    status: LoanStatus;
    lastAutoUpdate?: string; // ISO string to track last EMI increment
}

export type JobStatus = 'Need to Apply' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface JobApplication {
    date: string; // ISO String
    company: string;
    role: string;
    status: JobStatus;
    source?: 'AI';
    location?: string;
    jobType?: JobType;
    salaryRange?: string;
    keyResponsibilities?: string[];
    requiredSkills?: string[];
    applyLink?: string;
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

export interface IncomeSource {
    id: string;
    name: string;
    amount: string;
}

export interface SIP {
    id: string;
    amount: string;
    mutualFund: string;
    platform?: string;
}

export interface ResumeContactInfo {
  name: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface ResumeWorkExperience {
  company: string;
  location: string;
  role: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  descriptionPoints: string[];
}

export interface ResumeProject {
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  location: string;
  gpa: string;
  endDate: string | null;
}

export interface ResumeData {
  contactInfo: ResumeContactInfo;
  summary: {
    title: string;
    text: string;
  };
  skills: Record<string, string>;
  workExperience: ResumeWorkExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
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
    emergencyFundTarget: string;
    sips: SIP[];
    travelGoals: TravelGoal[];
    dailyTasks: DailyTask[];
    incomeSources: IncomeSource[];
    resume?: ResumeData | null;
}
