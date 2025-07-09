
import type { AppData } from './types';
import { addMonths } from 'date-fns';

const now = new Date();

export const initialData: AppData = {
    goals: [
        {
            id: 'g1',
            category: 'Career',
            title: 'Find a New Job',
            description: 'Secure a new role with better growth opportunities.',
            deadline: addMonths(now, 3).toISOString(),
            steps: [
                { id: 'g1s1', text: 'Update resume and portfolio', completed: true },
                { id: 'g1s2', text: 'Apply to 10 jobs per week', completed: false },
                { id: 'g1s3', text: 'Network with 5 people in my field', completed: false },
            ]
        },
        {
            id: 'g2',
            category: 'Personal',
            title: 'Build an Emergency Fund',
            description: 'Save up for unexpected expenses.',
            deadline: addMonths(now, 6).toISOString(),
            steps: [
                { id: 'g2s1', text: 'Open a high-yield savings account', completed: false },
                { id: 'g2s2', text: 'Set up automatic monthly transfers', completed: false },
                { id: 'g2s3', text: 'Reach a savings goal of ₹40,000', completed: false },
            ]
        },
        {
            id: 'g3',
            category: 'Health',
            title: 'Improve Physical Fitness',
            description: 'Focus on consistent exercise and diet.',
            deadline: addMonths(now, 4).toISOString(),
            steps: [
                { id: 'g3s1', text: 'Go to the gym 3 times a week', completed: false },
                { id: 'g3s2', text: 'Meal prep for the week every Sunday', completed: false },
            ]
        },
    ],
    monthlyPlan: [
        {
            month: 'July 2025',
            theme: 'Foundation & Planning',
            tasks: [
                { text: 'Review and finalize all goals for the year', done: true },
                { text: 'Create a detailed monthly budget', done: false },
                { text: 'Outline key milestones for each goal', done: false },
            ]
        },
        {
            month: 'August 2025',
            theme: 'Execution & Momentum',
            tasks: [
                { text: 'Start working on the first steps of each goal', done: false },
                { text: 'Set up weekly check-ins to track progress', done: false },
                { text: 'Adjust plan based on initial progress and challenges', done: false },
            ]
        },
    ],
    carSaleChecklist: [
        { id: 'cs-1', text: 'Request official foreclosure letter from bank', done: false },
        { id: 'cs-2', text: 'Collect all documents (RC, Insurance, PUC, etc.)', done: false },
        { id: 'cs-3', text: 'Get quotes from multiple platforms (e.g., Cars24, Spinny)', done: false },
        { id: 'cs-4', text: 'Finalize buyer and agree on price', done: false },
        { id: 'cs-5', text: 'Complete RC transfer process', done: false },
        { id: 'cs-6', text: 'Receive loan closure confirmation & NOC from bank', done: false },
    ],
    carSalePrice: '500000',
    carLoanPayoff: '400000',
    loans: [
        { id: 'loan-1', name: 'Car Loan', principal: '400000', rate: '9.5', tenure: '48', emisPaid: '12', status: 'Active', lastAutoUpdate: new Date().toISOString() },
        { id: 'loan-2', name: 'Personal Loan', principal: '50000', rate: '14', tenure: '24', emisPaid: '6', status: 'Active', lastAutoUpdate: new Date().toISOString() },
    ],
    jobApplications: [],
    resume: null,
    emergencyFund: '0',
    emergencyFundTarget: '40000',
    sips: [],
    travelGoals: [],
    dailyTasks: [],
    incomeSources: [
        { id: 'income-1', name: 'Primary Job', amount: '50000' }
    ],
    lastJobSuggestionCheck: new Date(0).toISOString(),
};
