import React from 'react';

const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center bg-primary/5 rounded-l-2xl">
        <svg width="80%" height="80%" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.9 }} />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path d="M 50,100 C 50,50 100,50 150,100 S 250,150 300,100" stroke="url(#grad1)" fill="transparent" strokeWidth="10" strokeLinecap="round" transform="rotate(15 175 125)" />
            <circle cx="80" cy="250" r="40" fill="hsl(var(--accent))" opacity="0.7" filter="url(#glow)" />
            <rect x="250" y="200" width="80" height="80" rx="15" fill="hsl(var(--primary))" opacity="0.6" transform="rotate(-30 290 240)" />
            <path d="M 100,350 L 150,300 L 200,350 Z" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="3" />
            <text x="50%" y="90%" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="24" fill="hsl(var(--primary))" fontWeight="600">Resolve25</text>
        </svg>
    </div>
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full lg:grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 lg:p-12">
        {children}
      </div>
      <AuthIllustration />
    </div>
  );
}
