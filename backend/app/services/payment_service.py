from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

import mercadopago
from fastapi import HTTPException, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.redis import get_redis
from app.models.membership import Membership, MembershipStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.plan import Plan
from app.repositories.user_repo import UserRepository
from app.services.gamification_service import GamificationService
from app.services.notification_service import NotificationService

POINTS_TO_BRL_RATE = 0.01
MAX_POINTS_DISCOUNT_PERCENT = 0.30


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

    async def create_pix_payment(
        self,
        user_id: str,
        plan_id: str,
        use_points_discount: bool = False,
    ) -> Payment:
        plan = await self.db.get(Plan, plan_id)
        if not plan or not plan.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Plano não encontrado',
            )

        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Usuário não encontrado',
            )

        discount_points = 0
        discount_amount = 0.0

        if use_points_discount and user.current_points > 0:
            max_discount = float(plan.price) * MAX_POINTS_DISCOUNT_PERCENT
            points_value = user.current_points * POINTS_TO_BRL_RATE
            discount_amount = min(points_value, max_discount)
            discount_points = int(discount_amount / POINTS_TO_BRL_RATE)
            discount_amount = round(discount_points * POINTS_TO_BRL_RATE, 2)

        final_amount = round(float(plan.price) - discount_amount, 2)
        if final_amount < 1.0:
            final_amount = 1.0

        expiration = datetime.now(UTC) + timedelta(
            minutes=settings.MP_PIX_EXPIRATION_MINUTES
        )
        payment_data = {
            'transaction_amount': final_amount,
            'description': f'GymForce - {plan.name}',
            'payment_method_id': 'pix',
            'payer': {
                'email': user.email,
                'first_name': user.name.split()[0] if user.name else 'Aluno',
                'identification': {
                    'type': 'CPF',
                    'number': user.cpf or '00000000000',
                },
            },
            'date_of_expiration': expiration.isoformat(),
        }

        request_options = mercadopago.config.RequestOptions()
        request_options.custom_headers = {'x-idempotency-key': str(uuid4())}

        try:
            result = self.sdk.payment().create(payment_data, request_options)
            mp_response = result.get('response', {})
            if result.get('status') not in (200, 201):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=(
                        f"Erro Mercado Pago: {mp_response.get('message', 'Erro desconhecido')}"
                    ),
                )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f'Falha na comunicação com Mercado Pago: {str(exc)}',
            ) from exc

        pix_data = mp_response.get('point_of_interaction', {}).get('transaction_data', {})

        payment = Payment(
            user_id=user_id,
            plan_id=plan_id,
            amount=float(plan.price),
            discount_points=discount_points,
            discount_amount=discount_amount,
            final_amount=final_amount,
            method=PaymentMethod.PIX,
            status=PaymentStatus.PENDING,
            mp_payment_id=str(mp_response.get('id', '')),
            mp_qr_code=pix_data.get('qr_code', ''),
            mp_qr_code_base64=pix_data.get('qr_code_base64', ''),
            mp_ticket_url=pix_data.get('ticket_url') or mp_response.get('ticket_url'),
            expires_at=self._parse_datetime(mp_response.get('date_of_expiration')),
        )
        self.db.add(payment)
        await self.db.flush()

        if discount_points > 0:
            try:
                redis = await get_redis()
            except Exception:
                redis = None

            gamification = GamificationService(self.db, redis)
            await gamification.debit_points(
                user_id=user_id,
                points=discount_points,
                description=f'Desconto na mensalidade: {plan.name}',
                ref_id=payment.id,
                commit=False,
            )

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def process_webhook(self, mp_payment_id: str) -> Payment | None:
        result = await self.db.execute(
            select(Payment)
            .options(selectinload(Payment.plan))
            .where(Payment.mp_payment_id == mp_payment_id)
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return None

        try:
            mp_result = self.sdk.payment().get(int(mp_payment_id))
            mp_data = mp_result.get('response', {})
            mp_status = mp_data.get('status', '')
        except Exception:
            return payment

        status_map = {
            'approved': PaymentStatus.APPROVED,
            'pending': PaymentStatus.PENDING,
            'rejected': PaymentStatus.REJECTED,
            'cancelled': PaymentStatus.CANCELLED,
            'refunded': PaymentStatus.REFUNDED,
            'expired': PaymentStatus.EXPIRED,
        }
        new_status = status_map.get(mp_status, payment.status)

        if new_status == payment.status:
            return payment

        payment.status = new_status

        if new_status == PaymentStatus.APPROVED:
            payment.paid_at = datetime.now(UTC)
            await self._activate_membership(payment)

            try:
                notification_service = NotificationService(self.db)
                plan_name = payment.plan.name if payment.plan else ''
                await notification_service.send_to_user(
                    payment.user_id,
                    'Pagamento confirmado! ✅',
                    f'Sua mensalidade {plan_name} foi ativada.'.strip(),
                )
            except Exception:
                pass

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def _activate_membership(self, payment: Payment) -> None:
        plan = await self.db.get(Plan, payment.plan_id)
        if not plan:
            return

        today = date.today()
        result = await self.db.execute(
            select(Membership).where(
                and_(
                    Membership.user_id == payment.user_id,
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
            )
        )
        existing = result.scalars().first()

        if existing:
            existing.end_date = existing.end_date + timedelta(days=plan.duration_days)
            existing.payment_status = 'paid'
            payment.membership_id = existing.id
            return

        membership = Membership(
            user_id=payment.user_id,
            plan_id=payment.plan_id,
            start_date=today,
            end_date=today + timedelta(days=plan.duration_days),
            status=MembershipStatus.ACTIVE,
            payment_status='paid',
        )
        self.db.add(membership)
        await self.db.flush()
        payment.membership_id = membership.id

    async def get_user_payments(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        result = await self.db.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_membership(self, user_id: str) -> dict | None:
        today = date.today()
        result = await self.db.execute(
            select(Membership)
            .options(selectinload(Membership.plan))
            .where(
                and_(
                    Membership.user_id == user_id,
                    Membership.status == MembershipStatus.ACTIVE,
                )
            )
            .order_by(Membership.end_date.desc())
        )
        membership = result.scalars().first()
        if not membership:
            return None

        return {
            'id': membership.id,
            'user_id': membership.user_id,
            'plan_id': membership.plan_id,
            'start_date': str(membership.start_date),
            'end_date': str(membership.end_date),
            'status': membership.status.value,
            'payment_status': membership.payment_status,
            'plan_name': membership.plan.name if membership.plan else None,
            'days_remaining': (membership.end_date - today).days,
        }

    async def expire_overdue_memberships(self) -> int:
        today = date.today()
        result = await self.db.execute(
            update(Membership)
            .where(
                and_(
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date < today,
                )
            )
            .values(status=MembershipStatus.EXPIRED)
        )
        await self.db.commit()
        return result.rowcount or 0

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
