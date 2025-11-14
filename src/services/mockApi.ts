// Этот файл имитирует ответы вашего FastAPI бэкенда

// 1. Стартовые данные, как будто они лежат в БД
let mockTasks = [
    { id: 1, text: 'Прочитать документацию MAX Bridge', goal: 3600, streak: 3, longest_streak: 5, completed_today: true, last_completed_date: '2025-11-14' },
    { id: 2, text: 'Написать Dockerfile для фронтенда', goal: 1800, streak: 0, longest_streak: 2, completed_today: false, last_completed_date: null },
];

let nextId = 3;

// Имитация задержки сети
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// 2. Функции, которые полностью повторяют сигнатуры реальных API-вызовов

export const getTasks = async () => {
    console.log('[MOCK API] Fetching tasks...');
    await networkDelay(300);
    return mockTasks;
};

export const addTask = async (text: string, goal: number) => {
    console.log('[MOCK API] Adding task:', text);
    await networkDelay(200);
    const newTask = {
        id: nextId++,
        text,
        goal,
        streak: 0,
        longest_streak: 0,
        completed_today: false,
        last_completed_date: null,
    };
    mockTasks.push(newTask);
    return newTask;
};

export const deleteTask = async (id: number) => {
    console.log('[MOCK API] Deleting task:', id);
    await networkDelay(200);
    mockTasks = mockTasks.filter(task => task.id !== id);
    return { success: true };
};

export const syncTask = async (id: number, timeSpent: number) => {
    console.log(`[MOCK API] Syncing task ${id} with time ${timeSpent}`);
    await networkDelay(150);
    const task = mockTasks.find(t => t.id === id);
    if (task) {
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