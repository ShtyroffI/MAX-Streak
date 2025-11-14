// Этот файл решает, использовать реальный API или заглушку.
// Единственное место, которое вам нужно будет изменить для переключения.

const USE_MOCK_API = true; // <-- Поставьте `false`, когда ваш бэкенд будет готов!

import * as realApi from './realApi';
import * as mockApi from './mockApi';

const api = USE_MOCK_API ? mockApi : realApi;

export default api;