import { useState } from 'react';
import { Profile } from './components/Profile';
import { Tasks } from './components/Tasks';
import { Home } from './components/Home';
import { Home as HomeIcon, ListTodo, User } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'profile' | 'tasks'>('home');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto pb-20">
        {currentTab === 'home' && <Home />}
        {currentTab === 'profile' && <Profile />}
        {currentTab === 'tasks' && <Tasks />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              currentTab === 'profile' ? 'text-orange-500' : 'text-zinc-400'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Профиль</span>
          </button>
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              currentTab === 'home' ? 'text-orange-500' : 'text-zinc-400'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Главная</span>
          </button>
          <button
            onClick={() => setCurrentTab('tasks')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              currentTab === 'tasks' ? 'text-orange-500' : 'text-zinc-400'
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