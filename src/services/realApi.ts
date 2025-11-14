// Здесь будут жить реальные сетевые запросы к вашему бэкенду

// --- ВАШЕ МЕСТО РАБОТЫ ---
// Просто замените эту ссылку на адрес вашего развернутого бэкенда
const API_URL = "http://localhost:8000";
// -------------------------

const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(`Network response was not ok for url: ${url}`);
    }
    return response.json();
};

export const authenticateAndGetData = async (initData: string) => {
    return request(`${API_URL}/auth/max`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: initData }),
    });
};

// Все остальные функции должны принимать токен, который вернет ваш эндпоинт аутентификации
export const addTask = async (text: string, goal: number, authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text, goal }),
    });
};

export const deleteTask = async (id: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
};

export const syncTask = async (id: number, timeSpent: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}/sync?time_spent=${timeSpent}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
};