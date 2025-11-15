// Здесь будут жить реальные сетевые запросы к вашему бэкенду

const API_URL = "https://95cpfcz2-8000.euw.devtunnels.ms";

const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(`Network response was not ok for url: ${url}`);
    }
    // Проверяем, есть ли у ответа тело, прежде чем парсить JSON
    if (response.status === 204) {
        return null; // Для DELETE запросов
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

// ОБНОВЛЕНО: addTask теперь принимает тип задачи и цель
export const addTask = async (text: string, task_type: 'timer' | 'checklist', goal: number, authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        // Отправляем новые данные на бэкенд
        body: JSON.stringify({ text, task_type, goal: goal * 60 }), // goal в секундах
    });
};

export const deleteTask = async (id: number, authToken: string) => {
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
        body: JSON.stringify({ time_spent_today: timeSpent }),
    });
};

export const getTasks = async (authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
};