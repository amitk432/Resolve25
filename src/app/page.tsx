import Dashboard from '@/components/dashboard';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <Dashboard />
      </main>
    </div>
  );
}
