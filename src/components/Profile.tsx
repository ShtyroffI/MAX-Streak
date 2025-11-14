import { useEffect, useState } from 'react';
import { Flame, Trophy, Target } from 'lucide-react';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

export function Profile() {
  const [stats, setStats] = useState<Stats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('taskStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4">
      {/* Avatar */}
      <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 mb-4">
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name */}
      <h1 className="mb-8">Пользователь</h1>

      {/* Stats Cards */}
      <div className="w-full max-w-md space-y-3">
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-400 text-sm">Текущая серия</p>
            <p className="text-xl">{stats.currentStreak} дней</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-400 text-sm">Лучшая серия</p>
            <p className="text-xl">{stats.longestStreak} дней</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-400 text-sm">Всего выполнено</p>
            <p className="text-xl">{stats.totalCompleted} задач</p>
          </div>
        </div>
      </div>
    </div>
  );
}