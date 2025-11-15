# src/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas
from datetime import date, timedelta


async def get_or_create_user(db: AsyncSession, user_id: str):
    """Находит пользователя по user_id или создает нового."""
    query = select(models.User).filter(models.User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        user = models.User(user_id=user_id)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def get_user_stats(db: AsyncSession, user_id: str, tasks: List[models.Task]):
    """Собирает и возвращает общую статистику пользователя."""
    user = await get_or_create_user(db, user_id)
    current_streak = 0
    longest_streak = 0
    if tasks:
        current_streak = max(task.streak for task in tasks)
        longest_streak = max(task.longest_streak for task in tasks)
    
    return schemas.UserStats(
        total_completed=user.total_completed,
        current_streak=current_streak,
        longest_streak=longest_streak
    )

async def _increment_user_completed_tasks(db: AsyncSession, user_id: str):
    """Увеличивает счетчик выполненных задач у пользователя."""
    user = await get_or_create_user(db, user_id)
    user.total_completed += 1
    await db.commit()

# --- ОБНОВЛЕННАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СТРИКОВ ---
async def _update_streak_logic(db: AsyncSession, task: models.Task):
    """Обновляет стрик и инкрементирует общий счетчик задач."""
    today = date.today()
    if task.last_completed_date == today:
        return

    yesterday = today - timedelta(days=1)
    
    if task.last_completed_date == yesterday:
        task.streak += 1
    else:
        task.streak = 1
    
    task.last_completed_date = today
    
    if task.streak > task.longest_streak:
        task.longest_streak = task.streak
        
    # Ключевое изменение: инкрементируем общий счетчик
    await _increment_user_completed_tasks(db, user_id=task.user_id)


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
    """Асинхронно получить все задачи пользователя и сбросить статусы для старых задач."""
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
        # Сбрасываем счетчик времени для таймерных задач, если наступил новый день
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
    """Асинхронно удалить задачу (используется для кнопки с корзиной)."""
    db_task = await get_task(db, task_id, user_id)
    if db_task:
        await db.delete(db_task)
        await db.commit()
        return db_task
    return None

async def update_task_progress(db: AsyncSession, task: models.Task, time_spent_today: int):
    """Асинхронно обновить прогресс для задачи с таймером."""
    task.time_spent_today = time_spent_today
    if task.time_spent_today >= task.goal and not task.is_completed:
        await _update_streak_logic(db, task)
        task.is_completed = True
    await db.commit()
    await db.refresh(task)
    return task

async def toggle_checklist_task(db: AsyncSession, task: models.Task):
    """Отмечает задачу, обновляет стрик, удаляет задачу."""
    if task.is_completed:
        return None # Уже выполнена

    await _update_streak_logic(db, task)
    task.is_completed = True
    await db.commit()
    
    task_data_to_return = schemas.Task.from_orm(task)
    await db.delete(task)
    await db.commit()
    
    return task_data_to_return