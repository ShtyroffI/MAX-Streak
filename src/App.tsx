import { useEffect, useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks, Task } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';
import api from './services/api';

declare global {
  interface Window { WebApp: any; }
}

interface UserData {
  id: string;
  name: string;
  avatar: string;
}

// Вспомогательная функция для "обогащения" задач с бэкенда
const enrichTask = (task: any): Task => ({
  ...task,
  timeSpent: typeof task.timeSpent === 'number' ? task.timeSpent : 0,
  isRunning: false,
});

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
        let initDataString = "mock";
        if (window.WebApp && window.WebApp.initData) {
          initDataString = window.WebApp.initData;
          window.WebApp.ready();
        } else {
          console.warn("WebApp.initData not found. Using mock data.");
        }

        const response = await api.authenticateAndGetData(initDataString);

        setUserData(response.user);
        // ИСПРАВЛЕНИЕ 1: Обогащаем задачи при первой загрузке
        setTasks(response.tasks.map(enrichTask));
        setAuthToken(response.auth_token);

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Не удалось загрузить приложение.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.isRunning) {
            const currentTime = typeof task.timeSpent === 'number' ? task.timeSpent : 0;
            return { ...task, timeSpent: currentTime + 1 };
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ИСПРАВЛЕНИЕ 2: Обновляем `addTask`, чтобы не перезапрашивать весь список
  const handleAddTask = async (text: string) => {
    if (!authToken) return;
    try {
      // Бэкенд должен вернуть созданную задачу
      const newTaskFromServer = await api.addTask(text, 1800, authToken);
      // Добавляем новую задачу в конец списка, обогатив ее
      setTasks(prevTasks => [...prevTasks, enrichTask(newTaskFromServer)]);
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!authToken) return;
    // Оптимистичное обновление - сразу удаляем из UI
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await api.deleteTask(id, authToken);
    } catch (error) {
      console.error("Failed to delete task:", error);
      // В случае ошибки, нужно вернуть задачу обратно (для хакатона можно опустить)
    }
  };

  // ИСПРАВЛЕНИЕ 3: Обновляем `toggleTimer`, чтобы он сохранял `timeSpent`
  const handleToggleTimer = async (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const isStopping = taskToToggle.isRunning;

    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, isRunning: !isStopping } : task
      )
    );

    if (isStopping && authToken) {
      const timeToSend = typeof taskToToggle.timeSpent === 'number' ? taskToToggle.timeSpent : 0;
      try {
        // Бэкенд должен вернуть обновленную задачу со свежим стриком
        const updatedTaskFromServer = await api.syncTask(id, Math.floor(timeToSend), authToken);
        // Точечно обновляем стрик и статус выполнения у нашей задачи в состоянии
        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id
            ? {
              ...task,
              streak: updatedTaskFromServer.streak,
              longest_streak: updatedTaskFromServer.longest_streak,
              completed_today: updatedTaskFromServer.completed_today,
              isRunning: false // Явно выключаем таймер
            }
            : task
        ));
      } catch (error) {
        console.error("Failed to sync task:", error);
      }
    }
  };

  const handleUpdateGoal = (id: number, minutes: number) => {
    console.log("Update goal logic to be implemented");
  };

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