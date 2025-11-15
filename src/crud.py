# src/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas
from datetime import date, timedelta

async def get_task(db: AsyncSession, task_id: int, user_id: str):
    """Асинхронно получить задачу по ID."""
    query = select(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_tasks_by_user(db: AsyncSession, user_id: str):
    """Асинхронно получить все задачи пользователя и сбросить прогресс."""
    query = select(models.Task).filter(models.Task.user_id == user_id)
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    today = date.today()
    tasks_changed = False
    for task in tasks:
        if task.last_sync_date is None or task.last_sync_date < today:
            tasks_changed = True
            task.time_spent_today = 0
            task.last_sync_date = today
    
    if tasks_changed:
        await db.commit()
    
    return tasks

async def create_user_task(db: AsyncSession, task: schemas.TaskCreate, user_id: str):
    """Асинхронно создать новую задачу."""
    db_task = models.Task(**task.dict(), user_id=user_id)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

async def delete_task(db: AsyncSession, task_id: int, user_id: str):
    """Асинхронно удалить задачу."""
    db_task = await get_task(db, task_id, user_id)
    if db_task:
        await db.delete(db_task)
        await db.commit()
        return db_task
    return None

async def update_task_progress(db: AsyncSession, task: models.Task, time_spent_today: int):
    """Асинхронно обновить прогресс задачи."""
    today = date.today()
    
    task.time_spent_today = time_spent_today
    task.last_sync_date = today
    
    if task.time_spent_today >= task.goal and task.last_completed_date != today:
        yesterday = today - timedelta(days=1)
        
        if task.last_completed_date == yesterday:
            task.streak += 1
        else:
            task.streak = 1
        
        task.last_completed_date = today
        
        if task.streak > task.longest_streak:
            task.longest_streak = task.streak
            
    await db.commit()
    await db.refresh(task)
    return task