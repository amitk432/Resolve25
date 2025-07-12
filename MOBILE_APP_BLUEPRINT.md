
### **Resolve25 Mobile App Blueprint**

---

### **1. Functional Overview**

#### **Application Purpose**

**Resolve25** is a comprehensive, AI-powered "Life OS" designed to help users set, track, and achieve their personal and professional resolutions. It functions as a personal dashboard that integrates various aspects of life management, from goal setting and financial tracking to career development and travel planning.

#### **Target Audience**

The application is for individuals seeking a single, integrated platform to organize their ambitions, manage daily tasks, and receive AI-driven guidance to stay on track with their long-term goals.

#### **Key Features & User Workflows**

*   **User Authentication:** Users can create an account using email/password or sign in via Google and GitHub. All user data is tied to their unique account.
*   **Main Dashboard:** This is the central hub, providing a high-level overview of the user's progress. It features:
    *   **Key Metric Cards:** Quick stats on overall progress, emergency fund status, completed goals, and a countdown to the end of the year.
    *   **Critical Next Steps:** A focused list of the next three uncompleted tasks from all goals.
    *   **AI Insights:** A dedicated section where an AI analyzes the user's data to provide strategic suggestions.
*   **Modular Tabs:** The core functionality is organized into the following modules, accessible via a tabbed navigation system:
    1.  **Goals:** Users can create goals with titles, descriptions, categories (Health, Career, Personal), and deadlines. Each goal can be broken down into smaller, checkable steps. The AI can suggest new goals or provide tips for overcoming obstacles.
    2.  **Daily To-Do:** A complete task manager where tasks are added with due dates, priorities, and categories. The UI automatically groups tasks by date (e.g., "July 10, 2025") in collapsible sections, showing a progress bar for each day.
    3.  **Monthly Plan:** Users plan their year by creating themed months (e.g., "Focus on Fitness"). They can add specific tasks to each month, and the AI can suggest new plans or tasks based on existing goals.
    4.  **Job Search:** A career hub featuring:
        *   **Resume Builder:** A form to input all sections of a resume (contact, summary, skills, experience, etc.).
        *   **Application Tracker:** Users log job applications and track their status (e.g., 'Need to Apply', 'Interviewing'). The AI can generate new job suggestions and add them to the tracker.
        *   **AI Email Generation:** Users can generate a tailored cover letter/email for any tracked job application with a single click.
    5.  **Living Advisor:** An AI-powered tool that analyzes the user's resume and a detailed questionnaire to recommend suitable countries for relocation, complete with pros, cons, and a step-by-step roadmap.
    6.  **Travel Goals:** A visual log for "Planned" and "Completed" trips. The AI can suggest destinations or generate a full travel itinerary for a planned trip.
    7.  **Finance Tracker:** A module for managing loans, tracking an emergency fund against a target, and logging Systematic Investment Plans (SIPs) and income sources.
    8.  **Car Sale:** A specialized checklist and financial calculator to manage the process of selling a car.

---

### **2. Design and Layout Analysis**

#### **Overall Layout**

The application uses a single-page dashboard layout.
*   **Header:** A persistent header contains the app logo ("Resolve25"), a mobile navigation trigger (hamburger menu), a light/dark theme switcher, and a user profile dropdown with a "Log Out" option.
*   **Navigation:**
    *   **Desktop:** A horizontal, scrollable tab list sits below the header for navigating between modules.
    *   **Mobile:** A slide-out panel (sheet) from the left contains the navigation links, user profile information, and action buttons (theme switch, logout).
*   **Content Area:** The main content area is where the selected module's component is rendered. The layout is responsive, using a 1-column layout on mobile and transitioning to 2 or more columns on larger screens.
*   **Footer:** A simple footer with a "Built with ❤️" message is present at the bottom of the page.

#### **Colors (Dark Theme)**

The interface uses a modern, dark theme with vibrant accents.
*   **Background:** `hsl(224 71.4% 4.1%)` - A very dark blue, almost black.
*   **Primary/Accent Gradient:** A gradient is used for primary buttons and highlights, from **Primary** to **Accent**.
    *   **Primary:** `hsl(262.1 83.3% 57.8%)` - A vibrant purple.
    *   **Accent:** `hsl(346.8 77.2% 49.8%)` - A bright pink/magenta.
*   **Card/Component Backgrounds:** `hsl(215 27.9% 16.9%)` - A dark, muted blue-gray for cards and input fields.
*   **Text (Foreground):** `hsl(210 20% 98%)` - Almost white, for high contrast.
*   **Muted Text:** `hsl(217.9 10.6% 64.9%)` - A light gray for descriptions and less important text.

#### **Typography**

*   **Primary Font:** **Inter** is used throughout the application for its clean and modern look. It's loaded from Google Fonts.
*   **Headings:** `text-2xl` (for main titles) and `text-lg` (for card titles), `font-bold`.
*   **Body Text:** `text-sm` for most content and descriptions.

---

### **3. User Experience Insights**

*   **Responsive Design:** The application is fully responsive. Key modules like the Job Search and Daily To-Do list transform from table/grid layouts on desktop to card-based layouts on mobile to ensure usability.
*   **AI Integration:** AI is a core part of the UX. It's used proactively (daily job suggestions) and on-demand (generating goals, tips, emails, itineraries). This is designed to reduce user effort and provide intelligent assistance. Loading states (spinners) are used during AI generation.
*   **Feedback:** The app uses `toast` notifications for user feedback on actions like adding a goal, saving data, or encountering an error.
*   **Onboarding:** For new users or misconfigured projects, the dashboard page provides clear, actionable instructions on how to set up Firestore rules or create a database, including links to the Firebase Console.

---

### **4. Technical Specifications**

*   **Framework:** Next.js 15 (with App Router).
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS with ShadCN UI components. This means the UI is built from a set of pre-styled, accessible, and composable React components.
*   **Backend & Database:** Firebase is used for all backend services.
    *   **Authentication:** Firebase Auth (Email/Password, Google, GitHub).
    *   **Database:** Firestore (NoSQL). All user data is stored in a single document per user under the `users/{userId}` path. This makes data management straightforward for a mobile app.
*   **Generative AI:** **Genkit for Firebase** is used to interface with Google's Gemini models.
    *   All AI logic is encapsulated in server-side "flows" located in `src/ai/flows/`. These flows handle tasks like parsing resumes, generating suggestions, and creating itineraries.
    *   The frontend communicates with these flows via Next.js Server Actions defined in `src/app/actions.ts`. A mobile app would need to call these server actions through a dedicated API layer.
*   **Data Models:** The core data structure is defined in `src/lib/types.ts` within the `AppData` interface. This provides a clear schema for all user data that the mobile app would need to read and write.
