# src/schemas.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# Схема для тела запроса на синхронизацию (без изменений)
class TaskSync(BaseModel):
    time_spent_today: int

# --- ОБНОВЛЕННАЯ СХЕМА СОЗДАНИЯ ЗАДАЧИ ---
class TaskCreate(BaseModel):
    text: str
    task_type: str = "timer"
    goal: Optional[int] = 1800

class TaskBase(BaseModel):
    text: str
    goal: Optional[int] = 1800

# --- ОБНОВЛЕННАЯ СХЕМА ДЛЯ ОТВЕТА API ---
class Task(TaskBase):
    id: int
    user_id: str
    
    # Новые поля
    task_type: str
    is_completed: bool

    # Поля таймера
    time_spent_today: int

    # Поля стриков
    streak: int
    longest_streak: int
    last_completed_date: Optional[date] = None

    class Config:
        from_attributes = True

# Остальные схемы (User, InitData, AuthResponse) остаются без изменений
class User(BaseModel):
    id: str
    name: Optional[str] = "Anonymous"
    avatar: Optional[str] = None

class InitData(BaseModel):
    raw_init_data: str

class AuthResponse(BaseModel):
    user: User
    tasks: List[Task]
    auth_token: str