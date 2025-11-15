// src/components/Tasks.tsx

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

// ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС: убираем completed_today
export interface Task {
  id: number;
  text: string;
  task_type: 'timer' | 'checklist';
  is_completed: boolean;
  goal: number;
  streak: number;
  longest_streak: number;
  // Локальные поля для UI
  timeSpent: number;
  isRunning: boolean;
}

interface TasksProps {
  tasks: Task[];
  isSubmitting: boolean;
  onAddTask: (text: string, isTimer: boolean, goalMins: number) => void;
  onDeleteTask: (id: number) => void;
  onToggleTimer: (id: number) => void;
  onToggleChecklist: (id: number) => void;
  onUpdateGoal: (id: number, minutes: number) => void;
}

export function Tasks({
  tasks,
  isSubmitting,
  onAddTask,
  onDeleteTask,
  onToggleTimer,
  onToggleChecklist,
  onUpdateGoal,
}: TasksProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const [isTimerTask, setIsTimerTask] = useState(true); // По умолчанию - таймер
  const [goalMinutes, setGoalMinutes] = useState(30);

  const handleAddTaskClick = () => {
    if (!newTaskText.trim()) return;

    // Гарантируем, что goalMinutes всегда является числом, даже если поле пустое
    const goal = isTimerTask ? (Number(goalMinutes) || 30) : 0;

    onAddTask(newTaskText, isTimerTask, goal);
    setNewTaskText('');
    // Сбрасываем цель на значение по умолчанию после добавления
    setGoalMinutes(30);
  };

  const totalTimeToday = tasks
    .filter(task => task.task_type === 'timer')
    .reduce((sum, task) => sum + task.timeSpent, 0);

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="text-xl font-medium mb-2">Мои задачи</h1>
      <div className="mb-6 bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Всего в фокусе сегодня</p>
        <p className="text-2xl text-orange-500">
          {Math.floor(totalTimeToday / 3600)}ч {Math.floor((totalTimeToday % 3600) / 60)}м
        </p>
      </div>
      <div className="mb-6 flex flex-col gap-3 bg-zinc-900 rounded-lg p-3">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Название новой задачи..."
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="task-type-switch"
              checked={isTimerTask}
              onCheckedChange={setIsTimerTask}
              disabled={isSubmitting}
            />
            <Label htmlFor="task-type-switch" className="text-sm text-zinc-400">Таймер</Label>
          </div>
          {isTimerTask && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-sm bg-zinc-800 border-zinc-700"
                disabled={isSubmitting}
              />
              <span className="text-sm text-zinc-400">мин</span>
            </div>
          )}
          <Button
            onClick={handleAddTaskClick}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isSubmitting || !newTaskText.trim()}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Задач пока нет</p><p className="text-sm">Начните свой первый стрик!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleTimer={onToggleTimer}
              onToggleChecklist={onToggleChecklist}
              onUpdateGoal={onUpdateGoal}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}