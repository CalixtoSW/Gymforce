from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.plan import Plan
from app.models.user import User, UserRole
from app.schemas.payment import (
    CreatePixPaymentRequest,
    MembershipResponse,
    PaymentResponse,
    PixPaymentResponse,
)
from app.services.payment_service import (
    MAX_POINTS_DISCOUNT_PERCENT,
    POINTS_TO_BRL_RATE,
    PaymentService,
)

router = APIRouter(prefix='/payments', tags=['payments'])


@router.post('/create-pix', response_model=PixPaymentResponse, status_code=201)
async def create_pix_payment(
    data: CreatePixPaymentRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PixPaymentResponse:
    service = PaymentService(db)
    payment = await service.create_pix_payment(
        user_id=user.id,
        plan_id=data.plan_id,
        use_points_discount=data.use_points_discount,
    )
    plan = await db.get(Plan, payment.plan_id)
    return PixPaymentResponse(
        payment_id=payment.id,
        plan_name=plan.name if plan else '',
        amount=float(payment.amount),
        discount_points=payment.discount_points,
        discount_amount=float(payment.discount_amount),
        final_amount=float(payment.final_amount),
        qr_code=payment.mp_qr_code or '',
        qr_code_base64=payment.mp_qr_code_base64 or '',
        ticket_url=payment.mp_ticket_url,
        expires_at=payment.expires_at,
        status=payment.status.value,
    )


@router.post('/webhook')
async def payment_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    body = await request.json()

    action = body.get('action', '')
    if action not in ('payment.created', 'payment.updated'):
        return {'status': 'ignored'}

    mp_payment_id = str(body.get('data', {}).get('id', ''))
    if not mp_payment_id:
        return {'status': 'no_id'}

    service = PaymentService(db)
    await service.process_webhook(mp_payment_id)
    return {'status': 'processed'}


@router.get('/my-membership', response_model=MembershipResponse | None)
async def get_my_membership(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MembershipResponse | None:
    service = PaymentService(db)
    data = await service.get_user_membership(user.id)
    if data is None:
        return None
    return MembershipResponse(**data)


@router.get('/history', response_model=list[PaymentResponse])
async def payment_history(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PaymentResponse]:
    service = PaymentService(db)
    payments = await service.get_user_payments(user.id, skip, limit)
    return [
        PaymentResponse(
            id=payment.id,
            plan_id=payment.plan_id,
            amount=float(payment.amount),
            discount_points=payment.discount_points,
            discount_amount=float(payment.discount_amount),
            final_amount=float(payment.final_amount),
            method=payment.method.value,
            status=payment.status.value,
            mp_payment_id=payment.mp_payment_id,
            paid_at=payment.paid_at,
            created_at=payment.created_at,
        )
        for payment in payments
    ]


@router.get('/plans', response_model=list[dict[str, Any]])
async def list_plans_with_discount(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict[str, Any]]:
    result = await db.execute(select(Plan).where(Plan.is_active.is_(True)))
    plans = list(result.scalars().all())

    output = []
    for plan in plans:
        max_discount = float(plan.price) * MAX_POINTS_DISCOUNT_PERCENT
        points_value = user.current_points * POINTS_TO_BRL_RATE
        discount = min(points_value, max_discount)
        discount_points = int(discount / POINTS_TO_BRL_RATE)
        discount = round(discount_points * POINTS_TO_BRL_RATE, 2)
        final_price = round(float(plan.price) - discount, 2)
        if final_price < 1.0:
            final_price = 1.0

        output.append(
            {
                'id': plan.id,
                'name': plan.name,
                'duration_days': plan.duration_days,
                'price': float(plan.price),
                'description': plan.description,
                'discount_available': discount,
                'discount_points': discount_points,
                'final_price_with_discount': final_price,
                'user_points': user.current_points,
            }
        )

    return output


@router.post('/admin/expire-overdue')
async def expire_overdue(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> dict[str, int]:
    service = PaymentService(db)
    count = await service.expire_overdue_memberships()
    return {'expired_count': count}
