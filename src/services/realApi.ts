// src/services/realApi.ts

const API_URL = "https://95cpfcz2-8000.euw.devtunnels.ms"; // Убедитесь, что это ваша актуальная ссылка

// Универсальная функция запроса. Исправлена, чтобы не падать на пустых ответах.
const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(`Network response was not ok for url: ${url}`);
    }
    if (response.status === 204) { // Код "No Content" для DELETE
        return null;
    }
    return response.json();
};

export const authenticateAndGetData = async (initData: string) => {
    return request(`${API_URL}/auth/max`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_init_data: initData }),
    });
};

export const addTask = async (text: string, task_type: 'timer' | 'checklist', goalInMinutes: number, authToken: string) => {
    const body: { text: string; task_type: string; goal?: number } = {
        text,
        task_type,
    };

    // Добавляем поле goal ТОЛЬКО если это задача с таймером
    if (task_type === 'timer') {
        const goal = (typeof goalInMinutes === 'number' && !isNaN(goalInMinutes)) ? goalInMinutes : 30;
        body.goal = goal * 60; // Переводим минуты в секунды
    }

    return request(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
    });
};
export const deleteTask = async (id: number, authToken: string) => {
    // Эта функция уже была исправлена для обработки 204, оставляем как есть
    const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(`Failed to delete task with id: ${id}`);
    }
    return;
};

// НОВАЯ ФУНКЦИЯ: для переключения галочки у checklist-задач
export const toggleTask = async (id: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
};

export const syncTask = async (id: number, timeSpent: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}/sync`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ time_spent_today: Math.floor(timeSpent) }),
    });
};

// getTasks не существует, но authenticateAndGetData делает то же самое
// Оставляем это на случай, если понадобится отдельная функция
// export const getTasks = ...