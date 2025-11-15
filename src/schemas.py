# src/schemas.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- НОВАЯ СХЕМА ДЛЯ СТАТИСТИКИ ---
class UserStats(BaseModel):
    total_completed: int
    current_streak: int
    longest_streak: int

# ... (TaskSync, TaskCreate, TaskBase, Task без изменений) ...

class TaskSync(BaseModel):
    time_spent_today: int

class TaskCreate(BaseModel):
    text: str
    task_type: str = "timer"
    goal: Optional[int] = 1800

class TaskBase(BaseModel):
    text: str
    goal: Optional[int] = 1800

class Task(TaskBase):
    id: int
    user_id: str
    task_type: str
    is_completed: bool
    time_spent_today: int
    streak: int
    longest_streak: int
    last_completed_date: Optional[date] = None

    class Config:
        from_attributes = True

class User(BaseModel):
    id: str
    name: Optional[str] = "Anonymous"
    avatar: Optional[str] = None

class InitData(BaseModel):
    raw_init_data: str

# --- ОБНОВЛЕННАЯ СХЕМА ОТВЕТА ДЛЯ АУТЕНТИФИКАЦИИ ---
class AuthResponse(BaseModel):
    user: User
    tasks: List[Task]
    stats: UserStats # <-- Новое поле
    auth_token: str

# --- НОВАЯ СХЕМА ОТВЕТА ДЛЯ ОБНОВЛЕНИЯ ЗАДАЧ ---
class TaskUpdateResponse(BaseModel):
    task: Optional[Task] # Может быть null, если задача удалена
    stats: UserStats