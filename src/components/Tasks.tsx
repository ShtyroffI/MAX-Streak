import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { Input } from './ui/input';
import { Button } from './ui/button';
// Импортируем наш новый "умный" API сервис
import api from '../services/api';

// Тип для задачи, который используется в этом компоненте.
// Он расширяет тип с бэкенда, добавляя поля для управления состоянием UI.
export interface Task {
  id: number;
  text: string;
  goal: number; // seconds
  streak: number;
  longest_streak: number;
  completed_today: boolean;

  // Поля, которые используются только на фронтенде для UI
  timeSpent: number;
  isRunning: boolean;
  startTime?: number;
}

// Определяем тип для props, которые приходят из App.tsx
interface TasksProps {
  authToken: string | null;
}

export function Tasks({ authToken }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- Функции для работы с API ---

  const fetchTasks = async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Вызываем функцию из нашего api-сервиса
      const dataFromApi = await api.getTasks(authToken);
      // Обогащаем данные с бэкенда локальными полями для управления UI
      const enrichedTasks = dataFromApi.map((task: any) => ({
        ...task,
        timeSpent: 0, // Время работы таймера сегодня (локально)
        isRunning: false,
      }));
      setTasks(enrichedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Можно добавить обработку ошибок для пользователя, например, показать сообщение
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim() || !authToken) return;
    try {
      await api.addTask(newTaskText, 1800, authToken); // 1800 сек = 30 мин по умолчанию
      setNewTaskText('');
      fetchTasks(); // Перезагружаем список задач, чтобы увидеть новую
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!authToken) return;
    try {
      await api.deleteTask(id, authToken);
      fetchTasks(); // Перезагружаем список, чтобы задача исчезла
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const syncProgress = async (id: number, timeSpent: number) => {
    if (!authToken) return;
    try {
      // Отправляем накопленное время на бэкенд для обновления стрика
      await api.syncTask(id, Math.floor(timeSpent), authToken);
      // Можно обновить данные для одной задачи, чтобы UI был отзывчивее,
      // но для хакатона полный перезапрос - это просто и надежно.
      fetchTasks();
    } catch (error) {
      console.error("Failed to sync task progress:", error);
    }
  };

  // --- Логика UI и локального состояния ---

  // Загружаем задачи, как только появляется токен авторизации
  useEffect(() => {
    fetchTasks();
  }, [authToken]);

  // Этот useEffect отвечает за работу локальных таймеров в UI
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.isRunning && task.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - task.startTime) / 1000);
            return {
              ...task,
              timeSpent: task.timeSpent + elapsed,
              startTime: now,
            };
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const isStopping = taskToToggle.isRunning;

    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, isRunning: !task.isRunning, startTime: !isStopping ? Date.now() : undefined }
          : task
      )
    );

    // Если таймер был остановлен, отправляем накопленное время на сервер
    if (isStopping) {
      syncProgress(id, taskToToggle.timeSpent);
    }
  };

  const updateGoal = (id: number, minutes: number) => {
    // Эта логика требует отдельного эндпоинта на бэкенде
    console.log(`Updating goal for task ${id} to ${minutes} minutes. API endpoint needed.`);
    // Пример вызова: await api.updateTaskGoal(id, minutes, authToken);
  };

  const totalTimeToday = tasks.reduce((sum, task) => sum + task.timeSpent, 0);

  // --- Рендеринг компонента ---

  if (isLoading) {
    return <div className="pt-16 text-center text-zinc-400">Загрузка задач...</div>;
  }

  return (
    <div className="min-h-screen px-4 pt-6">
      <h1 className="text-xl font-medium mb-2">Мои задачи</h1>

      <div className="mb-6 bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Всего в фокусе сегодня</p>
        <p className="text-2xl text-orange-500">
          {Math.floor(totalTimeToday / 3600)}ч {Math.floor((totalTimeToday % 3600) / 60)}м
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Читать статью, работать над кодом..."
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
        <Button onClick={addTask} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Задач пока нет</p>
            <p className="text-sm">Начните свой первый стрик!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleTimer={() => toggleTimer(task.id)}
              onUpdateGoal={(id, minutes) => updateGoal(Number(id), minutes)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}