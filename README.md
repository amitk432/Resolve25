
# Resolve25: Your AI-Powered Life OS ✨

Welcome to **Resolve25**, the ultimate dashboard to conquer your 2025 resolutions and beyond. This isn't just another to-do list; it's your personal operating system for life, supercharged with AI to help you set, track, and achieve your most ambitious goals.

![Resolve25 Logo](./public/icon.svg)

---

## 🎯 Core Features

Resolve25 is a comprehensive life-planning application built with a powerful set of integrated modules. Each feature is designed to give you clarity and control over your personal and professional life, with AI assistance available at every step.

### 1. Dashboard Overview
Get a bird's-eye view of your life's progress.
- **Overall Progress:** A master progress bar that visualizes how close you are to completing all your goals.
- **Key Metrics:** At-a-glance cards for your emergency fund status, completed vs. in-progress goals, and a countdown to the end of the year.
- **Critical Next Steps:** A focused list of the next three uncompleted steps from your goals to help you prioritize.
- **AI Insights:** An AI-powered assistant that analyzes your entire dashboard and provides high-level strategic suggestions.

### 2. Goals
The heart of your ambition. Set clear, actionable goals and track them to completion.
- **Create & Manage Goals:** Add new goals with titles, descriptions, categories (Career, Health, Personal), and deadlines.
- **Actionable Steps:** Break down each goal into smaller, manageable steps that you can check off as you go.
- **AI Goal Generation:** Feeling stuck? Let our AI analyze your progress and suggest your next big move, from new goals to daily tasks.
- **AI-Powered Tips:** If you're facing an obstacle, describe it to the AI and receive tailored tips to get you back on track.

### 3. Daily To-Do
Organize your day for maximum productivity.
- **Task Management:** A complete to-do list where you can add, edit, and delete tasks with due dates, priorities, and categories.
- **Smart Grouping:** Tasks are automatically organized into sections like "Overdue," "Today," "Tomorrow," and "Upcoming."
- **AI Task Suggestions:** Based on your active goals and monthly plans, the AI suggests relevant tasks for you to tackle today.

### 4. Monthly Action Plan
Bridge the gap between long-term goals and daily actions.
- **Strategic Planning:** Break down your year into themed monthly plans (e.g., "Focus on Fitness," "Career Push").
- **Monthly Tasks:** Add and complete specific tasks for each month that align with your overarching goals.
- **AI Plan Generation:** The AI can suggest new, relevant monthly plans and tasks based on your existing goals and progress.

### 5. Job Search & Career Hub
A dedicated module to manage your career path.
- **Resume Builder:** A guided editor to input your contact info, summary, skills, experience, projects, and education. Your resume is then beautifully formatted and can be downloaded as a PDF.
- **Application Tracker:** Log every job application and track its status from "Need to Apply" to "Offer."
- **AI Job Suggestions:** The AI analyzes your resume and suggests relevant, real job openings with Google search links. New jobs are suggested automatically every day.
- **AI Email Generator:** Instantly craft a professional, tailored cover letter/email for any job application in your tracker with a single click.

### 6. Global Living Advisor
Your AI-powered guide to international relocation.
- **Personalized Recommendations:** The AI analyzes your resume and a detailed questionnaire about your preferences to recommend the most suitable countries for you to live and work or study in.
- **Pros & Cons Analysis:** For each recommended country, get a detailed breakdown of pros (e.g., job market, quality of life) and cons (e.g., cost of living, language barriers).
- **Custom Relocation Roadmap:** Select a country to receive a step-by-step roadmap, including visa requirements, career/study milestones, housing tips, and cultural integration advice.
- **Goal Integration:** Add milestones from your roadmap directly to your "Goals" tab to start taking action immediately.

### 7. Finance Tracker
Gain control over your financial life.
- **Loan Management:** Track all your loans, including principal, interest rate, tenure, and repayment progress. The app automatically updates your EMI progress over time.
- **Emergency Fund:** Set a target for your emergency fund and track your savings.
- **SIP & Income Planner:** Log your Systematic Investment Plans (SIPs) and all your sources of monthly income to get a clear financial picture.
- **AI Financial Advisor:** Get tips on managing debt, building your savings, and planning future investments.

### 8. Travel Goals
Dream, plan, and log your adventures.
- **Wishlist & Log:** Keep a visual log of your "Planned" trips and "Completed" adventures.
- **Details & Notes:** Add travel dates and notes for your upcoming journeys.
- **AI Travel Assistant:** Get AI-powered suggestions for your next trip or activities for a planned vacation.

## 🚀 Getting Started

Ready to take control of your year? Follow these simple steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd Resolve25
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase & Auth0:**
    *   Create a project in [Supabase](https://supabase.com/) and [Auth0](https://auth0.com/).
    *   In Supabase, create a `users` table with columns: `id` (text, primary key), `data` (jsonb).
    *   In Auth0, configure your application and connection (e.g., Email/Password, Google, GitHub).
    *   Copy your Supabase and Auth0 project configuration into your `.env` file for local development. See `.env.example` for required variables.

4.  **Set up Genkit (Google AI):**
    *   Get a Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add your API key to your `.env` file for local development: `GOOGLE_API_KEY="YOUR_API_KEY"`

5.  **Run the app locally:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) in your browser and start resolving!

## ☁️ Deployment

This application can be deployed to any modern hosting platform that supports Next.js and Node.js. For example, you can use Vercel, Netlify, or your own server.

1.  **Build the app:**
    ```bash
    npm run build
    ```

2.  **Start the app:**
    ```bash
    npm start
    ```

3.  **Or deploy to Vercel:**
    - Push your code to GitHub and import the repo in [Vercel](https://vercel.com/).
    - Set your environment variables in the Vercel dashboard.
    - Deploy!

## 🛠️ Tech Stack

Resolve25 is built with a modern, powerful, and scalable tech stack:

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Generative AI:** [Google's Genkit](https://firebase.google.com/docs/genkit)
*   **Authentication:** [Auth0](https://auth0.com/)
*   **Database:** [Supabase](https://supabase.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Deployment:** [Vercel](https://vercel.com/) or any Next.js-compatible host

---

Built with ❤️ by the Resolve25 team.
