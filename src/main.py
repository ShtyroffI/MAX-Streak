# src/main.py
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from . import crud, models, schemas, security
from .database import SessionLocal, engine

# Создаем все таблицы в БД при запуске
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MAX Streak Mini App Backend")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Зависимость для проверки JWT токена и получения user_id
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )
        
    token = parts[1]
    user_id = security.decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

# --- Эндпоинты ---

@app.post("/auth/max", response_model=schemas.AuthResponse)
def validate_and_authenticate(init_data: schemas.InitData, db: Session = Depends(get_db)):
    """
    Валидирует initData, находит или создает пользователя,
    возвращает его данные, задачи и JWT токен.
    """
    validation_data = security.validate_init_data(init_data.raw_init_data)
    if not validation_data or "user" not in validation_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid hash or user data missing",
        )

    user_info = validation_data["user"]
    user_id = str(user_info.get("id"))

    # Создаем JWT токен для пользователя
    access_token = security.create_access_token(data={"sub": user_id})

    # Получаем все задачи пользователя из БД
    user_tasks = crud.get_tasks_by_user(db, user_id=user_id)
    
    # Формируем объект пользователя для ответа
    user_obj = schemas.User(
        id=user_id,
        name=f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
        avatar=user_info.get('photo_url')
    )

    return {
        "user": user_obj,
        "tasks": user_tasks,
        "auth_token": access_token
    }

@app.get("/tasks/", response_model=List[schemas.Task])
def read_tasks(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Получить все задачи аутентифицированного пользователя."""
    tasks = crud.get_tasks_by_user(db, user_id=user_id)
    return tasks

@app.post("/tasks/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Создать новую задачу для аутентифицированного пользователя."""
    return crud.create_user_task(db=db, task=task, user_id=user_id)

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Удалить задачу по ID."""
    deleted_task = crud.delete_task(db, task_id=task_id, user_id=user_id)
    if not deleted_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@app.put("/tasks/{task_id}/sync", response_model=schemas.Task)
def sync_task_progress(
    task_id: int, 
    sync_data: schemas.TaskSync, # Принимаем данные из тела запроса
    user_id: str = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    """Синхронизировать прогресс и обновить стрик."""
    db_task = crud.get_task(db, task_id=task_id, user_id=user_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Передаем обновленное время в CRUD функцию
    updated_task = crud.update_task_progress(
        db=db, 
        task=db_task, 
        time_spent_today=sync_data.time_spent_today
    )
    return updated_task