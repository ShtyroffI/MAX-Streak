import { useEffect, useState } from 'react';
import { Flame, Trophy, Target } from 'lucide-react';

// 1. Определяем тип для входящих данных (props)
interface ProfileProps {
  userData: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

// Определяем тип для статистики
interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

// 2. Указываем, что компонент принимает props
export function Profile({ userData }: ProfileProps) {
  const [stats, setStats] = useState<Stats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
  });

  useEffect(() => {
    // В будущем эту статистику также стоит запрашивать с бэкенда
    const savedStats = localStorage.getItem('taskStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // 3. Добавляем проверку на случай, если данные еще не загрузились
  if (!userData) {
    return (
      <div className="pt-16 text-center text-zinc-400">Загрузка профиля...</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4">
      {/* Avatar */}
      <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 mb-4">
        {/* 4. Используем реальные данные */}
        <img
          src={userData.avatar}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name */}
      <h1 className="text-2xl font-medium mb-8">{userData.name}</h1>

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