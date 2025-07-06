
import type { AppData } from './types';
import { subDays, addDays, addMonths } from 'date-fns';

const now = new Date();

export const initialData: AppData = {
    goals: [
        { 
            id: 'g1',
            category: 'Career', 
            title: 'Switch to a higher-paying QA role',
            description: 'Target a salary of ₹7–10 LPA by the end of 2025.',
            deadline: addMonths(now, 6).toISOString(),
            steps: [
                { id: 'g1s1', text: 'Refine resume for product-based companies', completed: true },
                { id: 'g1s2', text: 'Complete API testing course', completed: false },
                { id: 'g1s3', text: 'Build 2 portfolio projects on GitHub', completed: false },
            ]
        },
        { 
            id: 'g2',
            category: 'Personal', 
            title: 'Grow emergency fund', 
            description: 'Save consistently to build a solid financial cushion.',
            deadline: addMonths(now, 12).toISOString(),
            steps: [
                { id: 'g2s1', text: 'Open a high-yield savings account', completed: true },
                { id: 'g2s2', text: 'Automate a monthly transfer of ₹5,000', completed: true },
                { id: 'g2s3', text: 'Reach ₹40,000 emergency fund target', completed: false },
            ]
        },
         { 
            id: 'g3',
            category: 'Personal', 
            title: 'Master Java for Automation',
            description: 'Gain deep expertise in Java to enhance automation skills.',
            deadline: addMonths(now, 4).toISOString(),
            steps: [
                { id: 'g3s1', text: 'Finish advanced Java course on Udemy', completed: false },
                { id: 'g3s2', text: 'Refactor an existing Selenium project with better Java patterns', completed: false },
            ]
        },
    ],
    monthlyPlan: [
        { 
            month: 'July 2025', 
            theme: 'Reset & Rebuild Phase: Audit finances, upskill roadmap & car sell-off execution', 
            tasks: [
                { text: 'Finalize decision on car sale (if not done already)', done: true },
                { text: 'Consolidate short-term loans or close the smallest one', done: true },
                { text: 'Create a budget envelope (EMIs, groceries, savings, job-hunting)', done: true },
                { text: 'Refine resume and start customizing cover letters (target 3 templates: service-based, product-based, fintech)', done: false },
                { text: 'Choose a specialization: API testing (Postman + REST Assured) or Mobile Automation (Appium)', done: false },
                { text: 'Start free/paid course: Udemy: REST API Testing: Postman + Newman + REST Assured OR Java + Selenium Bootcamp', done: false },
            ]
        },
        { 
            month: 'August 2025', 
            theme: 'Learning + Preparation: Build confidence for new job roles', 
            tasks: [
                { text: 'Finish API or Appium mastery course', done: false },
                { text: 'Start building projects on GitHub: Functional Test, UI Test, API test framework', done: false },
                { text: 'Shortlist companies (TCS Digital, Thoughtworks, Publicis Sapient, Nagarro, GlobalLogic, etc.)', done: false },
                { text: 'Update LinkedIn: Add keywords like “QA Automation, SDET in progress, Selenium, Appium, REST API”', done: false },
                { text: 'Apply to 12–15 carefully selected job openings (don’t spam-apply!)', done: false },
                { text: 'Maintain 5-day work-study-health balance', done: false },
            ]
        },
        { 
            month: 'September 2025', 
            theme: 'Interview & Certifications: Job-ready polish + ISTQB Start', 
            tasks: [
                { text: 'Start ISTQB Foundation or Advanced Test Analyst preparation (Online or offline)', done: false },
                { text: 'Prepare answers for core QA topics: Bug Lifecycle, Automation Frameworks, Test Strategy etc.', done: false },
                { text: 'Participate in mock interviews (e.g., Pramp, InterviewBuddy)', done: false },
                { text: 'Document 3–5 STAR-based interview stories from your projects (like Maruti, Fuze)', done: false },
            ]
        },
        { 
            month: 'October 2025', 
            theme: 'Applications & Networking Push: Strong job outreach', 
            tasks: [
                { text: 'Apply to 20+ product/MNC openings (LinkedIn, Naukri, Instahyre, Hirect)', done: false },
                { text: 'Join peer QA communities (Telegram, Discord, Slack, GitHub QA groups)', done: false },
                { text: 'Network on LinkedIn: share projects or summaries from your GitHub (get seen!)', done: false },
                { text: 'Start investing ₹1,000–₹2,000 per month in a basic Emergency SIP', done: false },
            ]
        },
        { 
            month: 'November 2025', 
            theme: 'Job Offer-Oriented Strategy: Closures & transitions', 
            tasks: [
                { text: 'Target screening calls → 3–5 technical interviews', done: false },
                { text: 'Have readiness packet: Offer comparison template, Resignation Letter (drafted), Salary negotiation script', done: false },
                { text: 'Build 2-month survival runway (especially if switching jobs)', done: false },
            ]
        },
        { 
            month: 'December 2025', 
            theme: 'Achieve Short-Term Finish Line: Reflect, Realign, Roll Up', 
            tasks: [
                { text: 'Accept offer and join new role (if not already done)', done: false },
                { text: 'Close or prepay extra loan with car sale/freelance bonus', done: false },
                { text: 'Plan 2026: automation role with ₹8–10 LPA target, new stack (e.g., Cypress)', done: false },
                { text: 'Celebrate small & big wins (job, savings, learning, stability)', done: false },
            ]
        },
    ],
    carSaleChecklist: [
        { id: 'cs-1', text: 'Request official foreclosure letter from Toyota Financial', done: false },
        { id: 'cs-2', text: 'Collect all documents (RC, Insurance, PUC, Service Records)', done: false },
        { id: 'cs-3', text: 'Get quotes from multiple platforms (Cars24, Spinny, etc.)', done: false },
        { id: 'cs-4', text: 'Finalize buyer and agree on price', done: false },
        { id: 'cs-5', text: 'Coordinate with buyer to pay off the loan directly', done: false },
        { id: 'cs-6', text: 'Complete RC transfer process', done: false },
        { id: 'cs-7', text: 'Receive loan closure confirmation & NOC from bank', done: false },
        { id: 'cs-8', text: 'Receive balance payment from buyer', done: false },
    ],
    carSalePrice: '550000',
    carLoanPayoff: '402450',
    loans: [
        { id: 'loan-1', name: 'Toyota Financial (Car Loan)', principal: '394558', status: 'Active' },
        { id: 'loan-2', name: 'L&T Finance (Personal Loan)', principal: '0', status: 'Active' },
    ],
    jobApplications: [],
    emergencyFund: '0',
    sipStarted: false,
    sipAmount: '',
    sipMutualFund: '',
    sipPlatform: '',
    travelGoals: [],
};
