// Этот файл будет экспортировать либо реальные функции API, либо заглушки.

const MOCK_API = true; // <-- ГЛАВНЫЙ ПЕРЕКЛЮЧАТЕЛЬ!

// Импортируем функции из обоих источников
import * as realApi from './realApi';
import * as mockApi from './mockApi';

// Экспортируем нужную версию в зависимости от переключателя
export default MOCK_API ? mockApi : realApi;