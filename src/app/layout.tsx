
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { AuthProvider } from '@/hooks/use-auth';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Resolve25',
  description: 'A personal goal-setting and tracking app to help you crush your 2025 resolutions.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-sans antialiased h-full bg-background text-foreground flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <AuthProvider>
              <main className="flex-grow">
                {children}
              </main>
            </AuthProvider>
          </UserProvider>
          <Toaster />
          <footer className="border-t border-white/10 p-4 text-center text-sm text-muted-foreground">
            Built with ❤️ by <strong>AmiT</strong>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
