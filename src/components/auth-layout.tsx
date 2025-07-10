
import React from 'react';
import Image from 'next/image';

const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-16 rounded-l-2xl">
        <div className="relative w-72 h-72">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <Image src="/icon.svg" alt="Resolve25 Logo" width={256} height={256} className="relative z-10 rounded-3xl" />
        </div>
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
