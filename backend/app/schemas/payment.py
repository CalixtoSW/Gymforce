from datetime import datetime

from pydantic import BaseModel


class CreatePixPaymentRequest(BaseModel):
    plan_id: str
    use_points_discount: bool = False


class PixPaymentResponse(BaseModel):
    payment_id: str
    plan_name: str
    amount: float
    discount_points: int
    discount_amount: float
    final_amount: float
    qr_code: str
    qr_code_base64: str
    ticket_url: str | None
    expires_at: datetime | None
    status: str


class PaymentResponse(BaseModel):
    id: str
    plan_id: str
    amount: float
    discount_points: int
    discount_amount: float
    final_amount: float
    method: str
    status: str
    mp_payment_id: str | None
    paid_at: datetime | None
    created_at: datetime

    model_config = {'from_attributes': True}


class MembershipResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    start_date: str
    end_date: str
    status: str
    payment_status: str
    plan_name: str | None = None
    days_remaining: int | None = None

    model_config = {'from_attributes': True}
