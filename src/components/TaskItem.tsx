import { Trash2, Play, Pause, Target } from 'lucide-react';
import { Task } from './Tasks';
import { useState } from 'react';
import { Input } from './ui/input';

interface TaskItemProps {
  task: Task;
  onToggleTimer: (id: string) => void;
  onUpdateGoal: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggleTimer, onUpdateGoal, onDelete }: TaskItemProps) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState(Math.floor(task.goal / 60));

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (task.timeSpent / task.goal) * 100;

  const handleGoalUpdate = () => {
    if (goalMinutes > 0) {
      onUpdateGoal(task.id, goalMinutes);
    }
    setEditingGoal(false);
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        {/* Timer Button */}
        <button
          onClick={() => onToggleTimer(task.id)}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${task.isRunning
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
        >
          {task.isRunning ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Task Info */}
        <div className="flex-1">
          <p className="text-white mb-1">{task.text}</p>
          <div className="flex items-center gap-3 text-sm">
            <span className={`${task.completedToday ? 'text-green-500' : 'text-zinc-400'}`}>
              {formatTime(task.timeSpent)}
            </span>
            <span className="text-zinc-600">/</span>
            {editingGoal ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(parseInt(e.target.value) || 0)}
                  onBlur={handleGoalUpdate}
                  onKeyPress={(e) => e.key === 'Enter' && handleGoalUpdate()}
                  className="w-16 h-6 px-2 py-0 text-xs bg-zinc-800 border-zinc-700"
                  autoFocus
                />
                <span className="text-zinc-500 text-xs">мин</span>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                <Target className="w-3 h-3" />
                {Math.floor(task.goal / 60)}м
              </button>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${task.completedToday ? 'bg-green-500' : 'bg-orange-500'
            }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}