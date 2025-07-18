
import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center bg-muted/30 p-16 rounded-l-2xl">
        <div className="relative w-72 h-72">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <Image src="/icon.svg" alt="Resolve25 Logo" width={256} height={256} className="relative z-10 rounded-3xl" />
        </div>
    </div>
);

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col items-center justify-center min-h-screen p-6 lg:p-12">
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground mb-8">{description}</p>
            {children}
        </div>
      </div>
      <AuthIllustration />
    </div>
  );
}
