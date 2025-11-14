# src/security.py
import os
import hmac
import hashlib
from urllib.parse import parse_qsl, unquote
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# --- Безопасное получение секретных ключей из переменных окружения ---
BOT_SECRET_KEY = os.getenv("TOKEN", "your_default_bot_token_for_dev")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "a_very_secret_jwt_key_for_dev_only")

# --- Константы для JWT ---
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 неделя


def validate_init_data(raw_init_data: str) -> Optional[Dict[str, Any]]:
    """
    Валидирует строку initData от MAX Bridge в соответствии с документацией.
    """
    try:
        parsed_data = dict(parse_qsl(raw_init_data))
    except ValueError:
        return None

    if "hash" not in parsed_data:
        return None

    hash_from_init_data = parsed_data.pop("hash")
    
    # Сортируем ключи и формируем строку для проверки (data_check_string)
    sorted_pairs = sorted(parsed_data.items(), key=lambda x: x[0])
    check_string = "\n".join([f"{k}={v}" for k, v in sorted_pairs])

    # --- ВОТ ТО САМОЕ ИСПРАВЛЕНИЕ ---
    # Создаем ключ шифрования (secret_key), как указано в документации MAX.
    secret_key = hmac.new(key=b"WebAppData", msg=BOT_SECRET_KEY.encode('utf-8'), digestmod=hashlib.sha256).digest()
    # ------------------------------------

    # Вычисляем хеш от строки проверки, используя полученный secret_key
    calculated_hash = hmac.new(key=secret_key, msg=check_string.encode('utf-8'), digestmod=hashlib.sha256).hexdigest()

    if calculated_hash == hash_from_init_data:
        user_data = parsed_data.get("user")
        if user_data:
            from json import loads
            parsed_data["user"] = loads(unquote(user_data))
        return parsed_data
        
    return None

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None