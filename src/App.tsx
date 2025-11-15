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

// ИСПРАВЛЕНИЕ 1: Правильно читаем данные с бэкенда
const enrichTask = (taskFromServer: any): Task => ({
  ...taskFromServer,
  // Читаем time_spent_today с сервера, если его нет - ставим 0
  timeSpent: typeof taskFromServer.time_spent_today === 'number' ? taskFromServer.time_spent_today : 0,
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
        // Теперь enrichTask работает правильно
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

  const handleAddTask = async (text: string) => {
    if (!authToken) return;
    try {
      const newTaskFromServer = await api.addTask(text, 1800, authToken);
      // Применяем enrichTask и к новым задачам
      setTasks(prevTasks => [...prevTasks, enrichTask(newTaskFromServer)]);
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!authToken) return;
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await api.deleteTask(id, authToken);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

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
        const updatedTaskFromServer = await api.syncTask(id, Math.floor(timeToSend), authToken);

        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id
            ? {
              // ИСПРАВЛЕНИЕ 2: Применяем enrichTask к ответу от sync, но сохраняем isRunning
              ...enrichTask(updatedTaskFromServer),
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
      {/* Навигация без изменений */}
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