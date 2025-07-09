# Resolve25: Your AI-Powered Life OS ✨

Welcome to **Resolve25**, the ultimate dashboard to conquer your 2025 resolutions and beyond. This isn't just another to-do list; it's your personal operating system for life, supercharged with AI to help you set, track, and achieve your most ambitious goals.

![Resolve25 Logo](./public/icon.svg)

---

## 🎯 Core Features

*   **Integrated Dashboard:** Get a bird's-eye view of your life, from career goals to financial health, all in one place.
*   **AI Goal & Task Generation:** Feeling stuck? Let our AI analyze your progress and suggest your next big move, from new goals to daily tasks.
*   **Smart Financial Tracking:** Manage loans, track your emergency fund, and plan investments with AI-powered insights.
*   **Career Hub:** Track job applications, build your resume with our guided editor, and even get AI-generated cover letters tailored to each role.
*   **Monthly Action Plans:** Break down your big ambitions into manageable, month-by-month action plans.
*   **Travel Wishlist:** Dream, plan, and log your adventures around the globe.
*   **Secure & Personalized:** Built with Firebase for secure authentication and data storage, ensuring your plan is yours alone.

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

3.  **Set up Firebase:**
    *   Create a project in the [Firebase Console](https://console.firebase.google.com/).
    *   Enable **Email/Password** and **Google** authentication in the *Authentication* section.
    *   Create a **Firestore Database** in production mode.
    *   Update your Firestore security rules to allow user-specific access (see `src/app/dashboard/page.tsx` for the required rules if you encounter permission errors).
    *   Copy your Firebase project configuration into your `apphosting.yaml` file and `.env` for local development. You can find this in your Firebase project settings.

4.  **Set up Genkit (Google AI):**
    *   Get a Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add your API key to your `apphosting.yaml` file and `.env` for local development: `GOOGLE_API_KEY="YOUR_API_KEY"`

5.  **Run the app:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) in your browser and start resolving!

## 🛠️ Tech Stack

Resolve25 is built with a modern, powerful, and scalable tech stack:

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Generative AI:** [Google's Genkit](https://firebase.google.com/docs/genkit)
*   **Authentication & Database:** [Firebase](https://firebase.google.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Deployment:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

---

Built with ❤️ by the Firebase team.
