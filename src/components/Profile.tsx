// src/components/Profile.tsx

import { Task } from './Tasks'; // Убедитесь, что импортируете Task

// --- 1. ОПРЕДЕЛИТЕ ИНТЕРФЕЙС ДЛЯ СТАТИСТИКИ ---
interface UserStats {
  total_completed: number;
  current_streak: number;
  longest_streak: number;
}

// --- 2. ОПРЕДЕЛИТЕ ИНТЕРФЕЙС ДЛЯ PROPS КОМПОНЕНТА ---
interface ProfileProps {
  userData: { name: string; avatar: string } | null;
  tasks: Task[];
  stats: UserStats; // <-- Добавляем новое свойство
}

// --- 3. ИСПОЛЬЗУЙТЕ НОВЫЙ ИНТЕРФЕЙС ---
export function Profile({ userData, stats }: ProfileProps) {

  return (
    <div className="min-h-screen px-4 pt-6 text-center">
      {userData?.avatar && (
        <img
          src={userData.avatar}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-orange-500"
        />
      )}
      <h1 className="text-2xl font-bold mb-6">{userData?.name || 'Профиль'}</h1>

      {/* --- 4. ИСПОЛЬЗУЙТЕ ДАННЫЕ ИЗ stats --- */}
      <div className="space-y-3">
        <div className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
          <span className="text-zinc-400">🔥 Текущая серия</span>
          <span className="font-bold text-lg">{stats.current_streak} дней</span>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
          <span className="text-zinc-400">🏆 Лучшая серия</span>
          <span className="font-bold text-lg">{stats.longest_streak} дней</span>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
          <span className="text-zinc-400">🎯 Всего выполнено</span>
          <span className="font-bold text-lg">{stats.total_completed} задач</span>
        </div>
      </div>
    </div>
  );
}