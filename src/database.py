# src/database.py

# Новые импорты для асинхронной работы
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# URL для асинхронного драйвера aiosqlite
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./sql_app.db"

# Создаем асинхронный движок
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)

# Создаем асинхронную "фабрику" сессий
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# Базовый класс для моделей остается прежним
Base = declarative_base()

# Новая асинхронная функция для получения сессии
async def get_db():
    """
    Асинхронный генератор сессий.
    """
    async with AsyncSessionLocal() as session:
        yield session