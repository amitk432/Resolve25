import type { AppData } from './types';

export const initialData: AppData = {
    goals: [
        { category: '🚀 Career', goal: 'Switch to a higher-paying QA role', target: '₹7–10 LPA', status: 'To Do' },
        { category: '🚀 Career', goal: 'Get shortlisted at Tier 1 / Product companies', target: '3-5 Interviews', status: 'To Do' },
        { category: '🚀 Career', goal: 'Sharpen mobile, API, and performance testing', target: 'Project Completion', status: 'To Do' },
        { category: '💰 Financial', goal: 'Close at least one major loan', target: 'Car Loan', status: 'In Progress' },
        { category: '💰 Financial', goal: 'Grow emergency fund', target: '₹40,000+', status: 'To Do' },
        { category: '💰 Financial', goal: 'Begin SIPs or investment planning', target: '₹1-2K/month', status: 'To Do' },
        { category: '🧠 Skill', goal: 'Complete 1-2 certifications', target: 'ISTQB/API Cert', status: 'To Do' },
        { category: '🧠 Skill', goal: 'Master Java for automation & explore Cypress/Playwright', target: 'GitHub Projects', status: 'To Do' },
        { category: '🧠 Skill', goal: 'Build a public GitHub portfolio', target: '3+ Projects', status: 'To Do' },
        { category: '💼 Job Search', goal: 'Apply smartly to MNCs/remote-first firms', target: 'Targeted Applications', status: 'To Do' },
        { category: '💼 Job Search', goal: 'Build personalized cover letter + resume', target: '3 Templates', status: 'To Do' },
        { category: '💼 Job Search', goal: 'Leverage LinkedIn & communities weekly', target: 'Active Participation', status: 'To Do' },
    ],
    monthlyPlan: [
        { month: 'July 2025', theme: 'Reset & Rebuild Phase', tasks: [
            { text: 'Finalize decision on car sale', done: true },
            { text: 'Consolidate short-term loans or close the smallest one', done: false },
            { text: 'Create a budget envelope (EMIs, groceries, savings)', done: false },
            { text: 'Refine resume and start customizing cover letters', done: false },
            { text: 'Choose specialization: API testing or Mobile Automation', done: false },
            { text: 'Start free/paid course on chosen specialization', done: false },
        ]},
        { month: 'August 2025', theme: 'Learning + Preparation', tasks: [
            { text: 'Finish API or Appium mastery course', done: false },
            { text: 'Start building projects on GitHub (Functional, UI, API)', done: false },
            { text: 'Shortlist target companies (TCS, Thoughtworks, etc.)', done: false },
            { text: 'Update LinkedIn with new keywords', done: false },
            { text: 'Apply to 12–15 carefully selected job openings', done: false },
        ]},
        { month: 'September 2025', theme: 'Interview & Certifications', tasks: [
            { text: 'Start ISTQB Foundation or Advanced preparation', done: false },
            { text: 'Prepare answers for core QA topics', done: false },
            { text: 'Participate in mock interviews (Pramp, InterviewBuddy)', done: false },
            { text: 'Document 3–5 STAR-based interview stories', done: false },
        ]},
        { month: 'October 2025', theme: 'Applications & Networking Push', tasks: [
            { text: 'Apply to 20+ product/MNC openings', done: false },
            { text: 'Join peer QA communities (Telegram, Discord, etc.)', done: false },
            { text: 'Network on LinkedIn: share projects/summaries', done: false },
            { text: 'Start investing ₹1,000–₹2,000 per month in Emergency SIP', done: false },
        ]},
        { month: 'November 2025', theme: 'Job Offer-Oriented Strategy', tasks: [
            { text: 'Target screening calls → 3–5 technical interviews', done: false },
            { text: 'Prepare readiness packet (offer template, resignation draft)', done: false },
            { text: 'Build 2-month survival runway', done: false },
        ]},
        { month: 'December 2025', theme: 'Achieve Short-Term Finish Line', tasks: [
            { text: 'Accept offer and join new role', done: false },
            { text: 'Close or prepay extra loan with bonus/windfall', done: false },
            { text: 'Plan 2026 goals (new role, new stack)', done: false },
            { text: 'Celebrate wins!', done: false },
        ]},
    ],
    carSaleChecklist: [
        { text: 'Request official foreclosure letter from Toyota Financial', done: false },
        { text: 'Collect all documents (RC, Insurance, PUC, Service Records)', done: false },
        { text: 'Get quotes from multiple platforms (Cars24, Spinny, etc.)', done: false },
        { text: 'Finalize buyer and agree on price', done: false },
        { text: 'Coordinate with buyer to pay off the loan directly', done: false },
        { text: 'Complete RC transfer process', done: false },
        { text: 'Receive loan closure confirmation & NOC from bank', done: false },
        { text: 'Receive balance payment from buyer', done: false },
    ],
    loans: [
        { name: 'Toyota Financial (Car Loan)', principal: '₹3,94,558', status: 'Active' },
        { name: 'L&T Finance (Personal Loan)', principal: '[Enter Amount]', status: 'Active' },
    ],
    jobApplications: [],
    emergencyFund: '0',
    sipStarted: false
};
