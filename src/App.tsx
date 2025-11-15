import { useEffect, useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks, Task } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';
// ИСПРАВЛЕНИЕ 1: Импортируем все функции из api под псевдонимом 'api'
import * as api from './services/realApi';

// Объявляем глобальный объект window.WebApp для TypeScript
declare global {
  interface Window { WebApp: any; }
}

// Тип для данных пользователя, получаемых от бэкенда
interface UserData {
  id: string;
  name: string;
  avatar: string;
}

// Вспомогательная функция для "обогащения" задач, приходящих с бэкенда.
// Добавляет к ним локальные поля для управления UI.
const enrichTask = (taskFromServer: any): Task => ({
  ...taskFromServer,
  timeSpent: typeof taskFromServer.time_spent_today === 'number' ? taskFromServer.time_spent_today : 0,
  isRunning: false,
});

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'profile' | 'tasks'>('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ И РАБОТА С MAX BRIDGE ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const initDataString = await waitForWebApp();

        const response = await api.authenticateAndGetData(initDataString);

        setUserData(response.user);
        setTasks(response.tasks.map(enrichTask));
        setAuthToken(response.auth_token);

        // Сообщаем клиенту MAX, что UI готов к отображению
        window.WebApp?.ready();

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Не удалось загрузить приложение.");
      } finally {
        setIsLoading(false);
      }
    };

    // Надежная функция, которая дожидается готовности WebApp (сохранена из вашего кода)
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
              console.warn("WebApp not found after timeout. Using mock data.");
              resolve("mock_for_browser_dev");
            }
          }
        }, 100);
      });
    };

    initializeApp();
  }, []); // Пустой массив зависимостей = выполнить один раз при старте

  // --- УПРАВЛЕНИЕ НАТИВНЫМИ ФУНКЦИЯМИ MAX ---
  useEffect(() => {
    if (!window.WebApp) return;

    const backButton = window.WebApp.BackButton;
    const handleBackClick = () => setCurrentTab('home');

    if (currentTab === 'home') {
      backButton.hide();
    } else {
      backButton.show();
      backButton.onClick(handleBackClick);
    }

    const hasRunningTask = tasks.some(task => task.isRunning);
    if (hasRunningTask) {
      window.WebApp.enableClosingConfirmation();
    } else {
      window.WebApp.disableClosingConfirmation();
    }

    return () => {
      backButton.offClick(handleBackClick);
    };
  }, [currentTab, tasks]);

  // --- ЛОКАЛЬНАЯ ЛОГИКА ТАЙМЕРОВ ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(currentTasks => {
        if (!currentTasks.some(task => task.isRunning)) {
          return currentTasks;
        }
        return currentTasks.map(task =>
          task.isRunning
            ? { ...task, timeSpent: (task.timeSpent || 0) + 1 }
            : task
        );
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- ФУНКЦИИ-ОБРАБОТЧИКИ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ ---

  const handleAddTask = async (text: string, isTimer: boolean, goalMins: number) => {
    if (!text.trim() || !authToken) {
      // Если кнопка как-то нажалась, хотя не должна была, просто ничего не делаем
      return;
    }
    // Проверяем, не идет ли уже отправка
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const task_type = isTimer ? 'timer' : 'checklist';

      // Вызываем нашу новую, надежную API-функцию
      const newTaskFromServer = await api.addTask(text, task_type, goalMins, authToken);

      // Если все успешно, обновляем состояние
      setTasks(prevTasks => [...prevTasks, enrichTask(newTaskFromServer)]);
      window.WebApp?.HapticFeedback.notificationOccurred('success');

    } catch (error) {
      // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---
      // Если в api.addTask или где-то еще произошла ошибка, мы ее поймаем
      // и покажем пользователю.
      console.error("!!! ОШИБКА при создании задачи:", error);

      // Показываем нативное уведомление об ошибке
      if (window.WebApp?.showAlert) {
        window.WebApp.showAlert("Не удалось создать задачу. Попробуйте снова.");
      } else {
        alert("Не удалось создать задачу. Попробуйте снова.");
      }
      window.WebApp?.HapticFeedback.notificationOccurred('error');

    } finally {
      // Этот блок выполнится ВСЕГДА, даже если была ошибка,
      // и разблокирует интерфейс.
      setIsSubmitting(false);
    }
  };



  const handleDeleteTask = async (id: number) => {
    if (!authToken || isSubmitting) return;
    try {
      setIsSubmitting(true);
      window.WebApp?.HapticFeedback.impactOccurred('medium');
      await api.deleteTask(id, authToken);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      window.WebApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTimer = async (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    window.WebApp?.HapticFeedback.impactOccurred('light');
    const isStopping = taskToToggle.isRunning;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, isRunning: !isStopping } : task
      )
    );

    if (isStopping && authToken) {
      const timeToSend = taskToToggle.timeSpent || 0;
      try {
        const updatedTaskFromServer = await api.syncTask(id, Math.floor(timeToSend), authToken);
        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id
            ? {
              ...enrichTask(updatedTaskFromServer),
              isRunning: false // Явно останавливаем таймер после синхронизации
            }
            : task
        ));
      } catch (error) {
        console.error("Failed to sync task:", error);
      }
    }
  };

  // Этот обработчик теперь будет вызывать правильную функцию api.toggleTask
  const handleToggleChecklist = async (id: number) => {
    if (!authToken || isSubmitting) {
      return;
    }

    // Оптимистичное обновление: сразу убираем задачу из списка для мгновенной реакции UI.
    // Сохраняем ее на случай, если запрос не удастся и ее придется вернуть.
    const taskToRemove = tasks.find(t => t.id === id);
    if (!taskToRemove) return;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

    try {
      setIsSubmitting(true);

      // Отправляем запрос на бэкенд. Он обновит стрик и удалит задачу в БД.
      await api.toggleTask(id, authToken);

      // Если все успешно, вызываем HapticFeedback
      window.WebApp?.HapticFeedback.notificationOccurred('success');

      // TODO: Здесь нужно будет обновить глобальные счетчики (общее количество выполненных, стрик и т.д.)
      // на основе данных, которые мог бы вернуть toggleTask, если бы он их возвращал.
      // Пока просто удаляем.

    } catch (error) {
      console.error("Failed to complete and delete task:", error);

      // Если произошла ошибка, возвращаем задачу обратно в список
      setTasks(prevTasks => [...prevTasks, taskToRemove]);

      if (window.WebApp?.showAlert) {
        window.WebApp.showAlert("Не удалось выполнить задачу.");
      }
      window.WebApp?.HapticFeedback.notificationOccurred('error');

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = (id: number, minutes: number) => {
    console.log("Update goal logic to be implemented");
  };

  // --- РЕНДЕРИНГ КОМПОНЕНТА ---

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