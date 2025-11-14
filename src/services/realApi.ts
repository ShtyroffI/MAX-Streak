// Здесь будет жить логика реальных сетевых запросов

const API_URL = "http://localhost:8000";

// Вспомогательная функция, чтобы не дублировать код
const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Network response was not ok for url: ${url}`);
    }
    return response.json();
};

export const getTasks = async (authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
};

export const addTask = async (text: string, goal: number, authToken: string) => {
    return request(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text, goal })
    });
};

export const deleteTask = async (id: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
};

export const syncTask = async (id: number, timeSpent: number, authToken: string) => {
    return request(`${API_URL}/tasks/${id}/sync?time_spent=${timeSpent}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
};