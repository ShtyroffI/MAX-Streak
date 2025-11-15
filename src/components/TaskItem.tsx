// src/components/TaskItem.tsx

import { Trash2, Play, Pause, Target, Circle, CheckCircle2 } from 'lucide-react';
import { Task } from './Tasks';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  onToggleTimer: (id: number) => void;
  onToggleChecklist: (id: number) => void;
  onUpdateGoal: (id: number, minutes: number) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onToggleTimer, onToggleChecklist, onUpdateGoal, onDelete }: TaskItemProps) {
  const [editingGoal, setEditingGoal] = useState(false);

  const formatTime = (seconds: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      seconds = 0;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = task.goal > 0 ? (task.timeSpent / task.goal) * 100 : 0;

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="flex items-center gap-3">
        {task.task_type === 'timer' ? (
          <button onClick={() => onToggleTimer(task.id)} className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${task.isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            {task.isRunning ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </button>
        ) : (
          <button onClick={() => onToggleChecklist(task.id)} className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            {task.is_completed ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <Circle className="w-7 h-7 text-zinc-500" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-white mb-1 truncate ${task.is_completed ? 'line-through text-zinc-500' : ''}`}>{task.text}</p>
          {task.task_type === 'timer' && (
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-mono ${task.is_completed ? 'text-green-500' : 'text-zinc-400'}`}>{formatTime(task.timeSpent)}</span>
              <span className="text-zinc-600">/</span>
              <button onClick={() => setEditingGoal(true)} className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {Math.floor(task.goal / 60)}м
              </button>
            </div>
          )}
        </div>
        <button onClick={() => onDelete(task.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      {task.task_type === 'timer' && (
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mt-3">
          <div className={`h-full transition-all ${task.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
}