import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.push_token import PushToken

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_to_user(
        self, user_id: str, title: str, body: str, data: dict | None = None
    ) -> int:
        result = await self.db.execute(
            select(PushToken).where(PushToken.user_id == user_id)
        )
        tokens = list(result.scalars().all())

        if not tokens:
            return 0

        messages = [
            {
                'to': item.token,
                'title': title,
                'body': body,
                'sound': 'default',
                'data': data or {},
            }
            for item in tokens
        ]

        async with httpx.AsyncClient() as client:
            await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={'Content-Type': 'application/json'},
            )

        return len(messages)

    async def send_to_all(self, title: str, body: str, data: dict | None = None) -> int:
        result = await self.db.execute(select(PushToken))
        tokens = list(result.scalars().all())

        if not tokens:
            return 0

        messages = [
            {
                'to': item.token,
                'title': title,
                'body': body,
                'sound': 'default',
                'data': data or {},
            }
            for item in tokens
        ]

        sent = 0
        async with httpx.AsyncClient() as client:
            for index in range(0, len(messages), 100):
                batch = messages[index : index + 100]
                await client.post(
                    EXPO_PUSH_URL,
                    json=batch,
                    headers={'Content-Type': 'application/json'},
                )
                sent += len(batch)

        return sent

    async def register_token(
        self, user_id: str, token: str, device_type: str = 'unknown'
    ) -> PushToken:
        result = await self.db.execute(
            select(PushToken).where(
                PushToken.user_id == user_id,
                PushToken.token == token,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        push_token = PushToken(user_id=user_id, token=token, device_type=device_type)
        self.db.add(push_token)
        await self.db.commit()
        await self.db.refresh(push_token)
        return push_token

    async def remove_token(self, user_id: str, token: str) -> None:
        result = await self.db.execute(
            select(PushToken).where(
                PushToken.user_id == user_id,
                PushToken.token == token,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            await self.db.delete(existing)
            await self.db.commit()
