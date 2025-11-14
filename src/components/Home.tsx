import { Flame } from 'lucide-react';
import { Task } from './Tasks'; // Импортируем общий тип

interface HomeProps {
  userData: { name: string } | null;
  tasks: Task[];
}

export function Home({ userData, tasks }: HomeProps) {

  // Вычисляем статистику на лету из полученных данных
  const totalTimeToday = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
  const completedTasksCount = tasks.filter(task => task.completed_today).length;

  // Для общего стрика нужна более сложная логика на бэкенде,
  // пока можем показать стрик самой "прокачанной" задачи.
  const mainStreak = tasks.reduce((max, task) => task.streak > max ? task.streak : max, 0);
  const longestStreakEver = tasks.reduce((max, task) => task.longest_streak > max ? task.longest_streak : max, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  const { hours, minutes } = formatTime(totalTimeToday);

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4 text-center">
      {userData && <h1 className="text-2xl mb-4">Привет, {userData.name}!</h1>}

      <div className="flex flex-col items-center mb-8">
        <Flame className="w-48 h-48 text-orange-500 fill-orange-500" />
        <div className="mt-4">
          <span className="text-4xl text-white">{mainStreak} дня</span>
        </div>
        <div className="text-center mt-6">
          <Flame className="w-4 h-4 inline text-orange-500 mr-1" />
          <span className="text-sm text-zinc-400">Текущая серия</span>
        </div>
      </div>

      <div className="mb-8 text-center">
        <p className="text-zinc-400 text-sm mb-2">Сегодня в фокусе</p>
        <p className="text-3xl text-white">
          {hours}ч {minutes}м
        </p>
      </div>

      <div className="text-center space-y-2">
        <p className="text-zinc-400">Лучшая серия: <span className="text-white">{longestStreakEver} дней</span></p>
        <p className="text-zinc-400">Всего выполнено: <span className="text-white">{completedTasksCount} задач</span></p>
      </div>
    </div>
  );
}