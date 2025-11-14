import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

interface Task {
  id: string;
  text: string;
  timeSpent: number;
  goal: number;
  isRunning: boolean;
  completedToday: boolean;
}

export function Home() {
  const [stats, setStats] = useState<Stats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
  });
  const [totalTimeToday, setTotalTimeToday] = useState(0);

  useEffect(() => {
    const updateData = () => {
      const savedStats = localStorage.getItem('taskStats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        const tasks: Task[] = JSON.parse(savedTasks);
        const total = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
        setTotalTimeToday(total);
      }
    };

    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  const { hours, minutes } = formatTime(totalTimeToday);

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4">
      {/* Streak Display */}
      <div className="flex flex-col items-center mb-8">
        <Flame className="w-48 h-48 text-orange-500 fill-orange-500" />
        <div className="mt-4">
          <span className="text-4xl text-white">{stats.currentStreak} дня</span>
        </div>
        <div className="text-center mt-6">
          <Flame className="w-4 h-4 inline text-orange-500 mr-1" />
          <span className="text-sm text-zinc-400">Текущая серия</span>
        </div>
      </div>

      {/* Time Today */}
      <div className="mb-8 text-center">
        <p className="text-zinc-400 text-sm mb-2">Сегодня в фокусе</p>
        <p className="text-3xl text-white">
          {hours}ч {minutes}м
        </p>
      </div>

      {/* Quick Stats */}
      <div className="text-center space-y-2">
        <p className="text-zinc-400">Лучшая серия: <span className="text-white">{stats.longestStreak} дней</span></p>
        <p className="text-zinc-400">Всего выполнено: <span className="text-white">{stats.totalCompleted} задач</span></p>
      </div>
    </div>
  );
}