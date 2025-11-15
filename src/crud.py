# src/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas
from datetime import date, timedelta

# --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СТРИКОВ (чтобы не дублировать код) ---
def _update_streak_logic(task: models.Task):
    """Обновляет стрик для задачи, которую только что выполнили."""
    today = date.today()
    if task.last_completed_date == today:
        return # Если уже выполнена сегодня, ничего не делаем

    yesterday = today - timedelta(days=1)
    
    if task.last_completed_date == yesterday:
        task.streak += 1
    else:
        task.streak = 1
    
    task.last_completed_date = today
    
    if task.streak > task.longest_streak:
        task.longest_streak = task.streak

async def get_task(db: AsyncSession, task_id: int, user_id: str):
    """Асинхронно получить задачу по ID."""
    query = select(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_tasks_by_user(db: AsyncSession, user_id: str):
    """Асинхронно получить все задачи пользователя и сбросить статус is_completed для старых задач."""
    query = select(models.Task).filter(models.Task.user_id == user_id)
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    today = date.today()
    changed = False
    for task in tasks:
        # Сбрасываем is_completed, если задача была выполнена в предыдущие дни
        if task.is_completed and task.last_completed_date and task.last_completed_date < today:
            task.is_completed = False
            changed = True
        # Сбрасываем счетчик времени для таймерных задач
        if task.task_type == 'timer' and task.last_completed_date and task.last_completed_date < today:
             task.time_spent_today = 0
             changed = True

    if changed:
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
    """Асинхронно обновить прогресс для задачи с таймером."""
    task.time_spent_today = time_spent_today
    
    if task.time_spent_today >= task.goal:
        _update_streak_logic(task) # Используем общую функцию
        task.is_completed = True
            
    await db.commit()
    await db.refresh(task)
    return task

# --- НОВАЯ ФУНКЦИЯ ДЛЯ ЧЕКЛИСТОВ ---
async def toggle_checklist_task(db: AsyncSession, task: models.Task):
    """Переключает статус выполнения для задачи-чеклиста и обновляет стрик."""
    today = date.today()
    
    # Не даем снимать галочку в тот же день
    if task.is_completed and task.last_completed_date == today:
        return task # Возвращаем без изменений

    task.is_completed = not task.is_completed
    
    if task.is_completed:
        _update_streak_logic(task) # Обновляем стрик при установке галочки
    # При снятии галочки (is_completed=False) стрик не трогаем, просто меняем статус

    await db.commit()
    await db.refresh(task)
    return task