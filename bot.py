import asyncio
import logging
import os
from dotenv import load_dotenv

from maxapi import Bot, Dispatcher
from maxapi.types import MessageCreated, CommandStart, OpenAppButton, ButtonsPayload

load_dotenv()
logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.getenv('TOKEN')

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Хранилище: не дублируем кнопку
sent_users = set()


@dp.message_created(CommandStart())
async def start_handler(event: MessageCreated):
    user_id = event.from_user.user_id  # ← Правильное поле

    if user_id in sent_users:
        await event.message.answer("Кнопка уже ниже")
        return

    # Получаем бота
    me = await bot.get_me()
    bot_username = me.username
    bot_contact_id = str(me.user_id)

    logging.info(f"Bot: @{bot_username}, ID: {bot_contact_id}")

    # Инлайн-кнопка через attachments
    buttons = [
        [OpenAppButton(
            text="Открыть Web App",
            web_app=bot_username,
            contact_id=bot_contact_id
        )]
    ]
    payload = ButtonsPayload(buttons=buttons).pack()

    await event.message.answer(
        text="Для открытия Mini-App, нажми ниже",
        attachments=[payload]  # ← Только так!
    )

    sent_users.add(user_id)


async def main():
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())