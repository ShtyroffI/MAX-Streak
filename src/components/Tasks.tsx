import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { Input } from './ui/input';
import { Button } from './ui/button';

export interface Task {
  id: string;
  text: string;
  timeSpent: number; // seconds
  goal: number; // seconds (default 30 min = 1800)
  isRunning: boolean;
  startTime?: number;
  completedToday: boolean;
  lastCompletedDate?: string;
  createdAt: string;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      const loadedTasks = JSON.parse(savedTasks);
      // Reset daily progress if it's a new day
      const today = new Date().toDateString();
      const resetTasks = loadedTasks.map((task: Task) => {
        if (task.lastCompletedDate !== today) {
          return { ...task, timeSpent: 0, completedToday: false, isRunning: false };
        }
        return { ...task, isRunning: false };
      });
      setTasks(resetTasks);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
  }, [tasks]);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.isRunning && task.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - task.startTime) / 1000);
            const newTimeSpent = task.timeSpent + elapsed;
            const completedToday = newTimeSpent >= task.goal;
            
            return {
              ...task,
              timeSpent: newTimeSpent,
              startTime: now,
              completedToday,
              lastCompletedDate: completedToday ? new Date().toDateString() : task.lastCompletedDate,
            };
          }
          return task;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const today = new Date().toDateString();
    const completedToday = tasks.some(task => task.completedToday);

    const stats = JSON.parse(
      localStorage.getItem('taskStats') || 
      '{"currentStreak":0,"longestStreak":0,"totalCompleted":0,"lastActiveDate":""}'
    );

    const totalCompleted = tasks.filter(t => t.completedToday).length;

    // Update streak
    if (completedToday) {
      if (stats.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (stats.lastActiveDate === yesterdayStr || stats.currentStreak === 0) {
          stats.currentStreak += 1;
        } else {
          stats.currentStreak = 1;
        }
        stats.lastActiveDate = today;
      }
    }

    stats.totalCompleted = totalCompleted;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    localStorage.setItem('taskStats', JSON.stringify(stats));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      timeSpent: 0,
      goal: 1800, // 30 minutes default
      isRunning: false,
      completedToday: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTimer = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            isRunning: !task.isRunning,
            startTime: !task.isRunning ? Date.now() : undefined,
          };
        }
        return task;
      })
    );
  };

  const updateGoal = (id: string, minutes: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            goal: minutes * 60,
          };
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const totalTimeToday = tasks.reduce((sum, task) => sum + task.timeSpent, 0);

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="mb-2">Мои задачи</h1>
      
      {/* Total Time Today */}
      <div className="mb-6 bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Всего за сегодня</p>
        <p className="text-2xl text-orange-500">
          {Math.floor(totalTimeToday / 3600)}ч {Math.floor((totalTimeToday % 3600) / 60)}м
        </p>
      </div>

      {/* Add Task Form */}
      <div className="mb-6 flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Добавить новую задачу..."
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
        <Button
          onClick={addTask}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Нет задач</p>
            <p className="text-sm">Добавьте свою первую задачу!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleTimer={toggleTimer}
              onUpdateGoal={updateGoal}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}