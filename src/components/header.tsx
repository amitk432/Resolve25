import { Target } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">Resolve25</h1>
      </div>
    </header>
  );
}
