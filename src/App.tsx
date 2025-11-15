import { useEffect, useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks, Task } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';
import * as api from './services/realApi';

declare global {
  interface Window { WebApp: any; }
}

interface UserData { id: string; name: string; avatar: string; }
interface UserStats {
  total_completed: number;
  current_streak: number;
  longest_streak: number;
}

const enrichTask = (taskFromServer: any): Task => ({
  ...taskFromServer,
  timeSpent: typeof taskFromServer.time_spent_today === 'number' ? taskFromServer.time_spent_today : 0,
  isRunning: false,
});

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'profile' | 'tasks'>('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total_completed: 0, current_streak: 0, longest_streak: 0 });
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
  useEffect(() => {
    // ВОССТАНОВЛЕННАЯ ФУНКЦИЯ ОЖИДАНИЯ MAX BRIDGE
    const waitForWebApp = (): Promise<string> => {
      return new Promise((resolve) => {
        if (window.WebApp && window.WebApp.initData) {
          return resolve(window.WebApp.initData);
        }
        let attempts = 0;
        const interval = setInterval(() => {
          if (window.WebApp && window.WebApp.initData) {
            clearInterval(interval);
            resolve(window.WebApp.initData);
          } else {
            attempts++;
            if (attempts > 20) { // Ждем максимум 2 секунды
              clearInterval(interval);
              console.warn("WebApp not found. Using mock for dev.");
              // Для отладки в браузере, в проде эта строка никогда не выполнится
              resolve("mock_for_browser_dev");
            }
          }
        }, 100);
      });
    };

    const initializeApp = async () => {
      try {
        const initDataString = await waitForWebApp(); // Используем реальные данные
        const response = await api.authenticateAndGetData(initDataString);

        setUserData(response.user);
        setTasks(response.tasks.map(enrichTask));
        setAuthToken(response.auth_token);
        if (response.stats) {
          setUserStats(response.stats);
        }

        window.WebApp?.ready();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Не удалось загрузить приложение. Попробуйте перезапустить.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  // ... (useEffect для MAX Bridge UI и таймеров остаются без изменений) ...

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

  const handleAddTask = async (text: string, isTimer: boolean, goalMins: number) => {
    if (!text.trim() || !authToken || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const task_type = isTimer ? 'timer' : 'checklist';
      const newTaskFromServer = await api.addTask(text, task_type, goalMins, authToken);
      setTasks(prevTasks => [...prevTasks, enrichTask(newTaskFromServer)]);
      window.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      console.error("Failed to add task:", error);
      window.WebApp?.showAlert("Не удалось создать задачу.");
      window.WebApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!authToken || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await api.deleteTask(id, authToken);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      window.WebApp?.HapticFeedback.impactOccurred('medium');
    } catch (error) {
      console.error("Failed to delete task:", error);
      window.WebApp?.showAlert("Не удалось удалить задачу.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ИСПРАВЛЕННАЯ ВЕРСИЯ handleToggleTimer
  const handleToggleTimer = async (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;
    const isStopping = taskToToggle.isRunning;
    window.WebApp?.HapticFeedback.impactOccurred('light');

    setTasks(prevTasks => prevTasks.map(task => task.id === id ? { ...task, isRunning: !isStopping } : task));

    if (isStopping && authToken) {
      try {
        const timeToSend = taskToToggle.timeSpent || 0;
        // API теперь возвращает { task, stats }
        const response = await api.syncTask(id, Math.floor(timeToSend), authToken);

        // Обновляем статистику
        if (response.stats) {
          setUserStats(response.stats);
        }

        // Обновляем саму задачу, извлекая ее из ответа
        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id ? { ...enrichTask(response.task), isRunning: false } : task
        ));
      } catch (error) {
        console.error("Failed to sync task:", error);
        window.WebApp?.showAlert("Ошибка синхронизации.");
        // Можно добавить логику отката состояния, если нужно
      }
    }
  };

  const handleToggleChecklist = async (id: number) => {
    if (!authToken || isSubmitting) return;
    const taskToRemove = tasks.find(t => t.id === id);
    if (!taskToRemove) return;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

    try {
      setIsSubmitting(true);
      const response = await api.toggleTask(id, authToken);

      if (response.stats) {
        setUserStats(response.stats);
      }
      window.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      console.error("Failed to complete task:", error);
      setTasks(prevTasks => [...prevTasks, taskToRemove]);
      window.WebApp?.showAlert("Не удалось выполнить задачу.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = (id: number, minutes: number) => {
    console.log("Update goal logic not implemented");
  };

  // --- РЕНДЕРИНГ ---

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Загрузка...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto pb-20">
        {/* ПЕРЕДАЕМ СТАТИСТИКУ В КОМПОНЕНТЫ */}z
        {currentTab === 'home' && <Home userData={userData} tasks={tasks} stats={userStats} />}
        {currentTab === 'profile' && <Profile userData={userData} tasks={tasks} stats={userStats} />}
        {currentTab === 'tasks' && (
          <Tasks
            isSubmitting={isSubmitting}
            tasks={tasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onToggleTimer={handleToggleTimer}
            onToggleChecklist={handleToggleChecklist}
            onUpdateGoal={handleUpdateGoal}
          />
        )}
      </div>

      {/* Навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          <button onClick={() => setCurrentTab('profile')} className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'profile' ? 'text-orange-500' : 'text-zinc-400'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs">Профиль</span>
          </button>
          <button onClick={() => setCurrentTab('home')} className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'home' ? 'text-orange-500' : 'text-zinc-400'}`}>
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Главная</span>
          </button>
          <button onClick={() => setCurrentTab('tasks')} className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'tasks' ? 'text-orange-500' : 'text-zinc-400'}`}>
            <ListTodo className="w-6 h-6" />
            <span className="text-xs">Таски</span>
          </button>
        </div>
      </div>
    </div>
  );
}