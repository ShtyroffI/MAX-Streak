import { useEffect, useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';

// Глобальное объявление для объекта maxBridge
declare global {
  interface Window {
    maxBridge: any; // В идеале здесь должен быть более строгий тип из документации
  }
}

// Создадим тип для данных пользователя для наглядности
interface MaxUserData {
  id: string;
  name: string;
  avatar: string;
  token: string; // Это самый важный токен для авторизации на бэкенде
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'profile' | 'tasks'>('home');
  // Состояние для хранения данных пользователя
  const [userData, setUserData] = useState<MaxUserData | null>(null);
  // Отдельное состояние для токена, чтобы его было удобно передавать в API-слой
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Асинхронная функция для инициализации Bridge
    const initializeBridge = async () => {
      if (window.maxBridge) {
        try {
          console.log("MAX Bridge found, initializing...");
          // 1. Инициализация Bridge
          await window.maxBridge.init();
          console.log("MAX Bridge initialized successfully");

          // 2. Получение данных пользователя
          const data = await window.maxBridge.getUserData();
          console.log("User data received:", data);
          setUserData(data);

          // 3. Сохраняем токен для всех будущих запросов к API
          // В реальном приложении вы бы передали этот токен в ваш API-клиент
          // например: api.setAuthToken(data.token);
          setAuthToken(data.token);

        } catch (error) {
          console.error("MAX Bridge initialization or data fetching failed:", error);
        }
      } else {
        console.warn("MAX Bridge not found. Running in standalone browser mode.");
        // Устанавливаем "тестовые" данные для разработки в обычном браузере
        const mockUser = { id: 'test_user', name: 'Тестовый Пользователь', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop', token: 'test_token' };
        setUserData(mockUser);
        setAuthToken(mockUser.token);
      }
    };

    initializeBridge();
  }, []); // Пустой массив зависимостей гарантирует, что эффект выполнится один раз

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto pb-20">
        {/* 
          Теперь мы передаем полученные данные в дочерние компоненты.
          Это позволит персонализировать интерфейс и делать защищенные запросы к API.
        */}
        {currentTab === 'home' && <Home userData={userData} />}
        {currentTab === 'profile' && <Profile userData={userData} />}
        {currentTab === 'tasks' && <Tasks authToken={authToken} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'profile' ? 'text-orange-500' : 'text-zinc-400'
              }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Профиль</span>
          </button>
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'home' ? 'text-orange-500' : 'text-zinc-400'
              }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Главная</span>
          </button>
          <button
            onClick={() => setCurrentTab('tasks')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentTab === 'tasks' ? 'text-orange-500' : 'text-zinc-400'
              }`}
          >
            <ListTodo className="w-6 h-6" />
            <span className="text-xs">Таски</span>
          </button>
        </div>
      </div>
    </div>
  );
}