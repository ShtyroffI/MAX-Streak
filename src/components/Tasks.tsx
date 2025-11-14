import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Тип для задачи теперь используется глобально
export interface Task {
  id: number;
  text: string;
  goal: number;
  streak: number;
  longest_streak: number;
  completed_today: boolean;
  timeSpent: number;
  isRunning: boolean;
  startTime?: number;
}

interface TasksProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onDeleteTask: (id: number) => void;
  onToggleTimer: (id: number) => void;
  onUpdateGoal: (id: number, minutes: number) => void;
}

export function Tasks({ tasks, onAddTask, onDeleteTask, onToggleTimer, onUpdateGoal }: TasksProps) {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText);
    setNewTaskText('');
  };

  const totalTimeToday = tasks.reduce((sum, task) => sum + task.timeSpent, 0);

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="text-xl font-medium mb-2">Мои задачи</h1>

      <div className="mb-6 bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Всего в фокусе сегодня</p>
        <p className="text-2xl text-orange-500">
          {Math.floor(totalTimeToday / 3600)}ч {Math.floor((totalTimeToday % 3600) / 60)}м
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder="Читать статью, работать над кодом..."
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
        <Button onClick={handleAddTask} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Задач пока нет</p>
            <p className="text-sm">Начните свой первый стрик!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleTimer={() => onToggleTimer(task.id)}
              onUpdateGoal={(id, minutes) => onUpdateGoal(Number(id), minutes)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
} 