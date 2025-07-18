import React from 'react';
import type { AppData } from '@/lib/types';

interface DailyTasksTabProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

const DailyTasksTab: React.FC<DailyTasksTabProps> = ({ data, onUpdate }) => {
  // Basic rendering of daily tasks
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Your Daily Tasks</h2>
      <ul className="list-disc pl-6">
        {data.dailyTasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong> ({task.category}) - {task.completed ? 'Done' : 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DailyTasksTab;
