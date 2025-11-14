// Здесь будут жить реальные сетевые запросы к вашему бэкенду

// 1. Указываем ссылку на ваш бэкенд (без слеша в конце)
const API_URL = "https://95cpfcz2-8000.euw.devtunnels.ms";

// Вспомогательная функция для запросов
const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(`Network response was not ok for url: ${url}`);
    }
    return response.json();
};

// 2. ФУНКЦИЯ АУТЕНТИФИКАЦИИ, НАСТРОЕННАЯ НА /auth/max
export const authenticateAndGetData = async (initData: string) => {
    // Используем путь /auth/max, как вы и хотели
    return request(`${API_URL}/auth/max`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Используем ключ "raw", как было в нашем ТЗ
        body: JSON.stringify({ raw_init_data: initData }),
    });
};

// 3. ОБНОВЛЕННЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАДАЧАМИ
// Они должны принимать JWT-токен, который вернет ваш эндпоинт /auth/max

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
    const url = `${API_URL}/tasks/${id}/sync`;
    const timeSpentInteger = Math.floor(timeSpent);
    const body = JSON.stringify({ time_spent_today: timeSpentInteger });

    return request(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: body,
    });
};

// Функция для перезапроса всех задач
export const getTasks = async (authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
};