import { Flame, Trophy, Target } from 'lucide-react';
import { Task } from './Tasks'; // Импортируем общий тип

interface ProfileProps {
  userData: {
    name: string;
    avatar: string;
  } | null;
  tasks: Task[];
}

export function Profile({ userData, tasks }: ProfileProps) {

  // Вычисляем статистику из полученного списка задач
  const mainStreak = tasks.reduce((max, task) => task.streak > max ? task.streak : max, 0);
  const longestStreakEver = tasks.reduce((max, task) => task.longest_streak > max ? task.longest_streak : max, 0);
  const completedTasksCount = tasks.filter(task => task.completed_today).length;

  if (!userData) {
    return <div className="pt-16 text-center text-zinc-400">Загрузка профиля...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800 mb-4">
        <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-2xl font-medium mb-8">{userData.name}</h1>
      <div className="w-full max-w-md space-y-3">
        {/* Карточки теперь показывают актуальные, вычисленные данные */}
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Текущая серия</p>
            <p className="text-xl">{mainStreak} дней</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Лучшая серия</p>
            <p className="text-xl">{longestStreakEver} дней</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Всего выполнено</p>
            <p className="text-xl">{completedTasksCount} задач</p>
          </div>
        </div>
      </div>
    </div>
  );
}