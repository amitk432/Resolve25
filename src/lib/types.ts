export type GoalCategory = 'Health' | 'Career' | 'Personal';

export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  deadline: Date;
  steps: Step[];
}
