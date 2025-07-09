import React from 'react';
import Image from 'next/image';

const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center bg-primary/5 rounded-l-2xl p-16">
        <Image src="/icon.svg" alt="Resolve25 Logo" width={256} height={256} className="rounded-3xl shadow-2xl" />
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
