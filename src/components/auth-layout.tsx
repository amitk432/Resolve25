
import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-16 rounded-l-2xl relative overflow-hidden">
        {/* Background pattern for light theme */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-purple-200/20 dark:from-purple-600/20 dark:via-transparent dark:to-transparent"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_rgba(59,130,246,0.1)_180deg,_transparent_360deg)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_rgba(168,85,247,0.1)_180deg,_transparent_360deg)]"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-16 left-16 w-3 h-3 bg-blue-400/40 dark:bg-purple-400/40 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-32 right-32 w-2 h-2 bg-purple-400/40 dark:bg-pink-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-24 w-4 h-4 bg-pink-400/40 dark:bg-blue-400/40 rounded-full animate-bounce delay-1000"></div>
        
        {/* Floating orbs */}
          {/* Decorative orbs */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full animate-float blur-xl" />
          <div className="absolute bottom-40 right-16 w-24 h-24 bg-gradient-to-br from-green-200/20 to-blue-200/20 dark:from-green-500/20 dark:to-blue-500/20 rounded-full animate-float blur-lg" style={{ animationDelay: '-1s' }} />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-purple-200/20 to-pink-200/20 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full animate-float blur-md" style={{ animationDelay: '-2s' }} />
          
          {/* Floating icons */}
          <div className="absolute top-1/4 left-1/3 animate-float opacity-10 dark:opacity-20" style={{ animationDelay: '-0.5s' }}>
            <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          
          <div className="absolute bottom-1/3 left-1/4 animate-float opacity-10 dark:opacity-20" style={{ animationDelay: '-1.5s' }}>
            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.5 3l-1.09 2.26L6 6.55l2.91 1.29L9.5 10l.59-2.16L13 6.55l-2.41-1.29L9.5 3zm5.5 6l-.59 2.16L17.32 12l-2.41 1.84L15.5 16l-.59-2.16L12.5 12l2.41-1.84L15.5 10z"/>
            </svg>
          </div>
          
          <div className="absolute top-2/3 right-1/3 animate-float opacity-10 dark:opacity-20" style={{ animationDelay: '-2.5s' }}>
            <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
            </svg>
          </div>        {/* Goal-themed icons */}
        <div className="absolute top-24 right-24 text-blue-400/30 dark:text-purple-400/30 animate-float">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div className="absolute bottom-24 left-32 text-purple-400/30 dark:text-pink-400/30 animate-float delay-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
        </div>
        
        <div className="relative w-72 h-72">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 dark:from-purple-500 dark:to-pink-500 rounded-full blur-2xl opacity-20 dark:opacity-30 animate-pulse"></div>
            <Image src="/icon.svg" alt="Resolve25 Logo" width={256} height={256} className="relative z-10 rounded-3xl" />
        </div>
        
        {/* Add custom CSS for float animation */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
    </div>
);

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 bg-background relative">
      <div className="flex flex-col items-center justify-center h-full p-6 lg:p-12">
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground mb-8">{description}</p>
            {children}
        </div>
      </div>
      <AuthIllustration />
      
      {/* Enhanced Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Built with 
            <span className="text-red-500 animate-pulse text-base">❤</span> 
            by 
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              AmiT
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
