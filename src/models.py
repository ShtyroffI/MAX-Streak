# src/models.py
from sqlalchemy import Column, Integer, String, Date, Boolean, Sequence
from .database import Base
from datetime import date

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, Sequence('task_id_seq'), primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    text = Column(String, nullable=False)
    
    # --- НОВЫЕ ПОЛЯ СОГЛАСНО ТЗ ---
    task_type = Column(String, default="timer", nullable=False) # "timer" или "checklist"
    is_completed = Column(Boolean, default=False, nullable=False) # Для чекбоксов
    # --------------------------------

    # Поля для задач с таймером (остаются)
    goal = Column(Integer, default=1800)
    time_spent_today = Column(Integer, default=0)
    
    # Общие поля для стриков
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(Date, nullable=True)