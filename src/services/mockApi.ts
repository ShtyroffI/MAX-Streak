// Этот файл имитирует ответы вашего FastAPI бэкенда
import { Task } from '../components/Tasks'; // Используем общий тип Task

// Стартовые "данные из БД"
let mockTasks: Task[] = [
    {
        id: 1, text: 'Изучить документацию MAX Bridge', goal: 3600, streak: 5, longest_streak: 10, completed_today: true,
        // Фронтенд-поля
        timeSpent: 3610, isRunning: false
    },
    {
        id: 2, text: 'Написать Dockerfile для фронтенда', goal: 1800, streak: 0, longest_streak: 2, completed_today: false,
        // Фронтен-поля
        timeSpent: 950, isRunning: false
    },
    {
        id: 3, text: 'Подготовить презентацию', goal: 5400, streak: 1, longest_streak: 1, completed_today: false,
        // Фронтенд-поля
        timeSpent: 0, isRunning: false
    },
];

let nextId = 4;
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Функции-заглушки

export const authenticateAndGetData = async (initData: string) => {
    console.log('[MOCK API] Authenticating with:', initData);
    await networkDelay(500);
    return {
        user: {
            id: 'mock_user_123',
            name: 'Тестовый Пользователь',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        },
        tasks: mockTasks,
    };
};

export const addTask = async (text: string, goal: number, authToken: string) => {
    console.log('[MOCK API] Adding task:', text);
    await networkDelay(200);
    const newTask: Task = {
        id: nextId++,
        text,
        goal,
        streak: 0,
        longest_streak: 0,
        completed_today: false,
        timeSpent: 0,
        isRunning: false,
    };
    mockTasks.push(newTask);
    return newTask;
};

export const deleteTask = async (id: number, authToken: string) => {
    console.log('[MOCK API] Deleting task:', id);
    await networkDelay(200);
    mockTasks = mockTasks.filter(task => task.id !== id);
    return { success: true };
};

export const syncTask = async (id: number, timeSpent: number, authToken: string) => {
    console.log(`[MOCK API] Syncing task ${id} with time ${timeSpent}`);
    await networkDelay(150);
    const task = mockTasks.find(t => t.id === id);
    if (task) {
        // Упрощенная логика стрика для заглушки
        if (timeSpent >= task.goal && !task.completed_today) {
            task.completed_today = true;
            task.streak += 1;
            if (task.streak > task.longest_streak) {
                task.longest_streak = task.streak;
            }
        }
        return task;
    }
    return null;
};