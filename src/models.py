# src/models.py
from sqlalchemy import Column, Integer, String, Date, Boolean, Sequence, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import date

# --- НОВАЯ МОДЕЛЬ USER ---
class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    total_completed = Column(Integer, default=0, nullable=False)
    
    tasks = relationship("Task", back_populates="owner")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, Sequence('task_id_seq'), primary_key=True, index=True)
    # --- ИЗМЕНЕНИЕ: СВЯЗЬ С USER ---
    user_id = Column(String, ForeignKey("users.user_id"), index=True, nullable=False)
    # -------------------------------
    
    text = Column(String, nullable=False)
    task_type = Column(String, default="timer", nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    goal = Column(Integer, default=1800)
    time_spent_today = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(Date, nullable=True)

    owner = relationship("User", back_populates="tasks")