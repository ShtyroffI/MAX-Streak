# src/models.py
from sqlalchemy import Column, Integer, String, Date, Sequence
from .database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, Sequence('task_id_seq'), primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    text = Column(String, nullable=False)
    goal = Column(Integer, default=1800) # 30 минут в секундах
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(Date, nullable=True)