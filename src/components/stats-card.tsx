import type { Goal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsCardProps {
  goals: Goal[];
}

export default function StatsCard({ goals }: StatsCardProps) {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => {
    if (g.steps.length === 0) return false;
    return g.steps.every(s => s.completed);
  }).length;
  
  const totalProgress = totalGoals > 0 ? Math.round(
    goals.reduce((acc, goal) => {
      const completedSteps = goal.steps.filter(s => s.completed).length;
      const goalProgress = goal.steps.length > 0 ? (completedSteps / goal.steps.length) * 100 : 0;
      return acc + goalProgress;
    }, 0) / totalGoals
  ) : 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Goals</span>
          <span className="font-bold">{totalGoals}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Completed Goals</span>
          <span className="font-bold">{completedGoals}</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-muted-foreground">Average Completion</span>
            <span className="font-bold text-primary">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
