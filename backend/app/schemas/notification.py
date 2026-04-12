from pydantic import BaseModel, Field


class PushTokenRegister(BaseModel):
    token: str = Field(..., pattern=r'^ExponentPushToken\[.+\]$')
    device_type: str = Field('unknown', pattern=r'^(ios|android|unknown)$')


class PushTokenResponse(BaseModel):
    id: str
    token: str
    device_type: str

    model_config = {'from_attributes': True}


class SendNotificationRequest(BaseModel):
    user_id: str | None = None
    title: str = Field(..., max_length=100)
    body: str = Field(..., max_length=500)
