# src/schemas.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- Схемы для задач ---
class TaskSync(BaseModel):
    time_spent_today: int

# Базовая схема задачи
class TaskBase(BaseModel):
    text: str
    goal: int = 1800

# Схема для создания задачи
class TaskCreate(TaskBase):
    pass

# Схема для представления задачи в ответе API (включая все поля из БД)
class Task(TaskBase):
    id: int
    user_id: str
    streak: int
    longest_streak: int
    last_completed_date: Optional[date] = None
    time_spent_today: int

    class Config:
        from_attributes = True

# --- Схемы для аутентификации ---

# Схема для данных пользователя
class User(BaseModel):
    id: str
    name: Optional[str] = "Anonymous"
    avatar: Optional[str] = None

# Схема для тела запроса на валидацию
class InitData(BaseModel):
    raw_init_data: str

# Схема для успешного ответа аутентификации
class AuthResponse(BaseModel):
    user: User
    tasks: List[Task]
    auth_token: str