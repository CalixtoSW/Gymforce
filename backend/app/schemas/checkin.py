from datetime import datetime

from pydantic import BaseModel


class CheckinQRPayload(BaseModel):
    qr_token: str


class CheckinResponse(BaseModel):
    id: str
    user_id: str
    checked_in_at: datetime
    checked_out_at: datetime | None
    points_earned: int

    model_config = {"from_attributes": True}


class QRCodeResponse(BaseModel):
    qr_token: str
    expires_in_seconds: int
