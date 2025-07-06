
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Resolve25',
  description: 'A personal goal-setting and tracking app to help you crush your 2025 resolutions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased h-full bg-background text-foreground flex flex-col">
        <AuthProvider>
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
        <Toaster />
        <footer className="text-center p-4 text-muted-foreground text-sm flex-shrink-0">
          Made by AmiT with ❤️
        </footer>
      </body>
    </html>
  );
}
