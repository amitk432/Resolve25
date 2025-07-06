export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export type GoalCategory = 'Health' | 'Career' | 'Personal';

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  steps: Step[];
  category: GoalCategory;
}
