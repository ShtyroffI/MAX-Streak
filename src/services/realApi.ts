// Здесь будут жить реальные сетевые запросы к вашему бэкенду

const API_URL = "https://95cpfcz2-8000.euw.devtunnels.ms";

// Эта функция остается для запросов, которые возвращают JSON
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
        body: JSON.stringify({ raw_init_data: initData }),
    });
};

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