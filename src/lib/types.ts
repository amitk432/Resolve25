
import { z } from 'zod';

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


// --- Global Living Advisor Schemas & Types ---

export const RelocationQuestionnaireSchema = z.object({
  currentProfession: z.string().describe('The user\'s current profession or field of work.'),
  lifestyle: z.enum(['City', 'Suburban', 'Rural', 'Flexible']).describe('The user\'s preferred lifestyle.'),
  familySize: z.number().int().positive().describe('The number of people in the user\'s family who would be relocating.'),
  languageSkills: z.string().describe('A comma-separated list of languages the user speaks and their proficiency (e.g., "English (Fluent), Spanish (Beginner)").'),
  climatePreference: z.enum(['Warm', 'Cold', 'Temperate', 'No Preference']).describe('The user\'s preferred climate.'),
  workLifeBalance: z.enum(['Priority', 'Important', 'Balanced', 'Flexible']).describe('The importance of work-life balance to the user.'),
  careerGoals: z.string().describe('The user\'s primary career goals for the relocation (e.g., "Growth in tech sector", "Start a business", "Better salary").'),
});
export type RelocationQuestionnaire = z.infer<typeof RelocationQuestionnaireSchema>;

export const RelocationAdviceInputSchema = z.object({
  resume: z.any().optional().describe("The user's full resume data as a JSON object."),
  questionnaire: RelocationQuestionnaireSchema,
});
export type RelocationAdviceInput = z.infer<typeof RelocationAdviceInputSchema>;

export const CountryRecommendationSchema = z.object({
  country: z.string().describe('The name of the recommended country.'),
  suitabilityScore: z.number().min(1).max(100).describe('A score from 1-100 indicating how suitable the country is for the user.'),
  summary: z.string().describe('A brief, 2-3 sentence summary explaining why this country is a good match.'),
  pros: z.array(z.string()).describe('A list of 3-5 key advantages (pros) for the user to relocate to this country.'),
  cons: z.array(z.string()).describe('A list of 3-5 key disadvantages (cons) or challenges the user might face.'),
});
export type CountryRecommendation = z.infer<typeof CountryRecommendationSchema>;

export const RelocationAdviceOutputSchema = z.object({
  recommendations: z.array(CountryRecommendationSchema).describe('A list of 3-5 recommended countries for relocation, sorted by suitability score.'),
});
export type RelocationAdviceOutput = z.infer<typeof RelocationAdviceOutputSchema>;

export const RelocationRoadmapInputSchema = z.object({
    country: z.string().describe('The country selected by the user for the roadmap.'),
    profile: RelocationAdviceInputSchema.describe('The user\'s full profile (resume + questionnaire).'),
});
export type RelocationRoadmapInput = z.infer<typeof RelocationRoadmapInputSchema>;

export const RelocationRoadmapOutputSchema = z.object({
    visa: z.object({
        title: z.string().describe('Title for the visa section.'),
        steps: z.array(z.string()).describe('Step-by-step visa requirements and application process.'),
    }),
    housing: z.object({
        title: z.string().describe('Title for the housing section.'),
        options: z.array(z.string()).describe('A list of typical housing options and their estimated monthly costs (e.g., "1-bedroom city apartment: $1500", "3-bedroom suburban house: $2500").'),
    }),
    jobSearch: z.object({
        title: z.string().describe('Title for the job search section.'),
        strategies: z.array(z.string()).describe('Actionable job search strategies and insights into the local market relevant to the user\'s profession.'),
    }),
    culturalAdaptation: z.object({
        title: z.string().describe('Title for the cultural adaptation section.'),
        tips: z.array(z.string()).describe('Tips for cultural integration and adaptation.'),
    }),
    localResources: z.object({
        title: z.string().describe('Title for the local resources section.'),
        resources: z.array(z.string()).describe('A list of useful local resources like expat forums, community groups, or official websites.'),
    }),
});
export type RelocationRoadmapOutput = z.infer<typeof RelocationRoadmapOutputSchema>;

export interface LivingAdvisorData {
    questionnaire: RelocationQuestionnaire;
    recommendations: CountryRecommendation[];
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
    livingAdvisor?: LivingAdvisorData;
    lastJobSuggestionCheck?: string;
}
