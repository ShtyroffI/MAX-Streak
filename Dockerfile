# Используем официальный легковесный образ Python 3.10
FROM python:3.10-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл с зависимостями
# Обратите внимание, что requirements.txt должен лежать в корне проекта, а не в src
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем всю папку src в рабочую директорию /app
# В итоге внутри контейнера будет путь /app/src/main.py
COPY ./src ./src

# --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
# Указываем Uvicorn запускать приложение из модуля src.main
# Python теперь поймет, что "src" - это пакет, и относительные импорты заработают.
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]