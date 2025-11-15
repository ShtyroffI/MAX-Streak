# src/main.py

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from . import crud, models, schemas, security
from .database import Base, engine, get_db

app = FastAPI(title="MAX Streak Mini App Backend")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    # ... (эта функция без изменений)
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header is missing",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication scheme",
        )
    token = parts[1]
    user_id = security.decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

@app.post("/auth/max", response_model=schemas.AuthResponse)
async def validate_and_authenticate(init_data: schemas.InitData, db: AsyncSession = Depends(get_db)):
    validation_data = security.validate_init_data(init_data.raw_init_data)
    if not validation_data or "user" not in validation_data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid hash or user data missing")

    user_info = validation_data["user"]
    user_id = str(user_info.get("id"))
    
    # --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
    await crud.get_or_create_user(db, user_id=user_id) # Гарантируем, что юзер есть в БД
    access_token = security.create_access_token(data={"sub": user_id})
    user_tasks = await crud.get_tasks_by_user(db, user_id=user_id)
    user_stats = await crud.get_user_stats(db, user_id=user_id, tasks=user_tasks)
    # -----------------------

    user_obj = schemas.User(
        id=user_id,
        name=f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
        avatar=user_info.get('photo_url')
    )
    return {"user": user_obj, "tasks": user_tasks, "stats": user_stats, "auth_token": access_token}

@app.get("/tasks/", response_model=List[schemas.Task])
async def read_tasks(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # ... (этот эндпоинт без изменений)
    tasks = await crud.get_tasks_by_user(db, user_id=user_id)
    return tasks

@app.post("/tasks/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
async def create_task(task: schemas.TaskCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # ... (этот эндпоинт без изменений)
    return await crud.create_user_task(db=db, task=task, user_id=user_id)

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # ... (этот эндпоинт без изменений)
    deleted_task = await crud.delete_task(db, task_id=task_id, user_id=user_id)
    if not deleted_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@app.put("/tasks/{task_id}/sync", response_model=schemas.TaskUpdateResponse)
async def sync_task_progress(
    task_id: int, 
    sync_data: schemas.TaskSync,
    user_id: str = Depends(get_current_user_id), 
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud.get_task(db, task_id=task_id, user_id=user_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.task_type != "timer":
        raise HTTPException(status_code=400, detail="Sync is only for timer tasks.")
    
    updated_task = await crud.update_task_progress(db, db_task, sync_data.time_spent_today)
    
    # --- ВОЗВРАЩАЕМ ОБНОВЛЕННУЮ СТАТИСТИКУ ---
    user_tasks = await crud.get_tasks_by_user(db, user_id=user_id)
    user_stats = await crud.get_user_stats(db, user_id=user_id, tasks=user_tasks)
    return {"task": updated_task, "stats": user_stats}
    # ----------------------------------------

@app.put("/tasks/{task_id}/toggle", response_model=schemas.TaskUpdateResponse)
async def toggle_task_completion(
    task_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud.get_task(db, task_id=task_id, user_id=user_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.task_type != "checklist":
        raise HTTPException(status_code=400, detail="Toggle is only for checklist tasks.")

    deleted_task_data = await crud.toggle_checklist_task(db=db, task=db_task)
    
    # --- ВОЗВРАЩАЕМ ОБНОВЛЕННУЮ СТАТИСТИКУ ---
    user_tasks = await crud.get_tasks_by_user(db, user_id=user_id)
    user_stats = await crud.get_user_stats(db, user_id=user_id, tasks=user_tasks)
    return {"task": deleted_task_data, "stats": user_stats}
    # ----------------------------------------