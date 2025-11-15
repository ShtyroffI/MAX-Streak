// src/components/Home.tsx

import { Task } from './Tasks'; // Убедитесь, что импортируете Task

// --- 1. ОПРЕДЕЛИТЕ ИНТЕРФЕЙС ДЛЯ СТАТИСТИКИ ---
interface UserStats {
  total_completed: number;
  current_streak: number;
  longest_streak: number;
}

// --- 2. ОПРЕДЕЛИТЕ ИНТЕРФЕЙС ДЛЯ PROPS КОМПОНЕНТА ---
interface HomeProps {
  userData: { name: string } | null;
  tasks: Task[];
  stats: UserStats; // <-- Добавляем новое свойство
}

// --- 3. ИСПОЛЬЗУЙТЕ НОВЫЙ ИНТЕРФЕЙС ---
export function Home({ userData, tasks, stats }: HomeProps) {

  // Логика подсчета времени остается, так как она нужна для отображения "Сегодня в фокусе"
  const totalTimeToday = tasks
    .filter(task => task.task_type === 'timer')
    .reduce((sum, task) => sum + task.timeSpent, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="text-3xl font-bold mb-4">
        Привет, {userData?.name || 'Гость'}!
      </h1>

      <div className="mb-6 bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Сегодня в фокусе</p>
        <p className="text-3xl text-orange-500 font-semibold">{formatTime(totalTimeToday)}</p>
      </div>

      {/* --- 4. ИСПОЛЬЗУЙТЕ ДАННЫЕ ИЗ stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-zinc-900 p-4 rounded-lg">
          <p className="text-2xl font-bold">{stats.current_streak}</p>
          <p className="text-sm text-zinc-400">Текущая серия</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <p className="text-2xl font-bold">{stats.longest_streak}</p>
          <p className="text-sm text-zinc-400">Лучшая серия</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <p className="text-2xl font-bold">{stats.total_completed}</p>
          <p className="text-sm text-zinc-400">Всего выполнено</p>
        </div>
      </div>

      {/* Здесь может быть дополнительный контент для главной страницы */}
    </div>
  );
}