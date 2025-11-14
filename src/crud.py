# src/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date, timedelta

# --- CRUD для задач ---

def get_task(db: Session, task_id: int, user_id: str):
    """Получить задачу по ID, убедившись, что она принадлежит пользователю."""
    return db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()

def get_tasks_by_user(db: Session, user_id: str):
    """
    Получить все задачи пользователя.
    При первом заходе в новый день - сбросить прогресс.
    """
    tasks = db.query(models.Task).filter(models.Task.user_id == user_id).all()
    today = date.today()
    
    for task in tasks:
        if task.last_sync_date is None or task.last_sync_date < today:
            task.time_spent_today = 0
            task.last_sync_date = today
    db.commit()
    
    return tasks

def create_user_task(db: Session, task: schemas.TaskCreate, user_id: str):
    """Создать новую задачу для пользователя."""
    db_task = models.Task(**task.dict(), user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: str):
    """Удалить задачу пользователя."""
    db_task = get_task(db, task_id, user_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return db_task
    return None

def update_task_progress(db: Session, task: models.Task, time_spent_today: int):
    """
    Обновляет прогресс задачи и стрик на основе потраченного времени.
    """
    today = date.today()
    
    # 1. Сохраняем актуальный прогресс
    task.time_spent_today = time_spent_today
    task.last_sync_date = today
    
    # 2. Проверяем, выполнена ли цель
    if task.time_spent_today >= task.goal and task.last_completed_date != today:
        yesterday = today - timedelta(days=1)
        
        if task.last_completed_date == yesterday:
            task.streak += 1
        else:
            task.streak = 1
        
        task.last_completed_date = today
        
        if task.streak > task.longest_streak:
            task.longest_streak = task.streak
            
    db.commit()
    db.refresh(task)
    return task