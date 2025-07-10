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
  duration?: string;
  notes?: string;
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
  reasonForRelocation: z.enum(['Jobs', 'Study']).describe('The primary reason for the user\'s relocation.'),
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

export const RoadmapMilestoneSchema = z.object({
    milestone: z.string().describe('A specific, actionable career milestone.'),
    timeline: z.string().describe('An estimated timeline for this milestone, e.g., "0-3 Months".'),
    resources: z.string().describe('Suggested resources to achieve this milestone, e.g., "Local job boards (LinkedIn, Indeed), professional networking events".'),
});
export type RoadmapMilestone = z.infer<typeof RoadmapMilestoneSchema>;

const RoadmapSectionSchema = z.object({
    title: z.string(),
    points: z.array(z.string()),
});

const CareerRoadmapSectionSchema = z.object({
    title: z.string(),
    milestones: z.array(RoadmapMilestoneSchema),
});

export const RelocationRoadmapOutputSchema = z.object({
    visa: RoadmapSectionSchema.describe('Visa and documentation requirements.'),
    career: CareerRoadmapSectionSchema.describe('Career progression and job search strategies, or study plan and university information.'),
    housing: RoadmapSectionSchema.describe('Housing options and cost estimates.'),
    cultural: RoadmapSectionSchema.describe('Tips for cultural integration.'),
    resources: RoadmapSectionSchema.describe('List of helpful local resources.'),
});
export type RelocationRoadmapOutput = z.infer<typeof RelocationRoadmapOutputSchema>;


// --- Travel Itinerary Schemas & Types ---

export const GenerateTravelItineraryInputSchema = z.object({
  destination: z.string().describe('The travel destination, e.g., "Goa, India".'),
  duration: z.number().int().positive().describe('The duration of the trip in days.'),
});
export type GenerateTravelItineraryInput = z.infer<typeof GenerateTravelItineraryInputSchema>;

const DailyPlanSchema = z.object({
    title: z.string().describe('The title for the day, e.g., "Day 1: Arrival and Beach Hopping".'),
    theme: z.string().describe('A brief theme for the day\'s activities, e.g., "Coastal Exploration".'),
    activities: z.array(z.object({
        activity: z.string().describe('The name of the activity or place to visit.'),
        description: z.string().describe('A brief, helpful description of the activity.'),
    })).describe('A list of 3-4 activities for the day.'),
});

export const GenerateTravelItineraryOutputSchema = z.object({
  generalTips: z.array(z.string()).describe('A list of general tips for budget flights and accommodation.'),
  dailyPlan: z.array(DailyPlanSchema).describe('A day-by-day plan for the trip.'),
});
export type GenerateTravelItineraryOutput = z.infer<typeof GenerateTravelItineraryOutputSchema>;

export const GenerateTravelSuggestionOutputSchema = z.object({
    destination: z.string().describe('A suggested travel destination, e.g., "Kerala, India".'),
    reasoning: z.string().describe('A brief reason why this place is a good choice for the current month.'),
});
export type GenerateTravelSuggestionOutput = z.infer<typeof GenerateTravelSuggestionOutputSchema>;


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
