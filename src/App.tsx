import { useEffect, useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks, Task } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';
import api from './services/api';

// Объявляем правильный глобальный объект
declare global {
  interface Window { WebApp: any; }
}

interface UserData {
  id: string;
  name: string;
  avatar: string;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'profile' | 'tasks'>('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let initDataString: string;

        // Проверяем наличие WebApp и initData
        if (window.WebApp && window.WebApp.initData) {
          console.log("WebApp found, using initData.");
          initDataString = window.WebApp.initData;
        } else {
          console.warn("WebApp.initData not found. Using mock data for browser mode.");
          // Для разработки в браузере используем заглушку
          initDataString = "mock_for_browser_dev";
        }

        // Единственный запрос при старте для аутентификации и получения данных
        const response = await api.authenticateAndGetData(initDataString);

        setUserData(response.user);
        setTasks(response.tasks);
        setAuthToken(response.auth_token); // Сохраняем JWT токен от нашего бэкенда

        // Сообщаем клиенту MAX, что приложение готово к отображению
        window.WebApp?.ready();

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Не удалось загрузить приложение.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []); // Пустой массив зависимостей = выполнить один раз при старте

  // Остальная часть компонента остается без изменений, так как архитектура уже правильная
  // (локальные таймеры, функции-обработчики и т.д.)

  // Локальная логика таймеров
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.isRunning
            ? { ...task, timeSpent: task.timeSpent + 1 }
            : task
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Функции-обработчики ---
  const handleAddTask = async (text: string) => {
    if (!authToken) return;
    await api.addTask(text, 1800, authToken);
    const updatedTasks = await api.getTasks(authToken);
    setTasks(updatedTasks);
  };

  const handleDeleteTask = async (id: number) => {
    if (!authToken) return;
    await api.deleteTask(id, authToken);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleToggleTimer = (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const isStopping = taskToToggle.isRunning;
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, isRunning: !task.isRunning } : task
      )
    );

    if (isStopping && authToken) {
      api.syncTask(id, taskToToggle.timeSpent, authToken);
    }
  };

  const handleUpdateGoal = (id: number, minutes: number) => {
    console.log("Update goal logic to be implemented");
  };

  // --- Рендеринг ---
  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Загрузка...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto pb-20">
        {currentTab === 'home' && <Home userData={userData} tasks={tasks} />}
        {currentTab === 'profile' && <Profile userData={userData} tasks={tasks} />}
        {currentTab === 'tasks' && (
          <Tasks
            tasks={tasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onToggleTimer={handleToggleTimer}
            onUpdateGoal={handleUpdateGoal}
          />
        )}
      </div>

      {/* Навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'profile' ? 'text-orange-500' : 'text-zinc-400'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Профиль</span>
          </button>
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'home' ? 'text-orange-500' : 'text-zinc-400'}`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Главная</span>
          </button>
          <button
            onClick={() => setCurrentTab('tasks')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'tasks' ? 'text-orange-500' : 'text-zinc-400'}`}
          >
            <ListTodo className="w-6 h-6" />
            <span className="text-xs">Таски</span>
          </button>
        </div>
      </div>
    </div>
  );
}