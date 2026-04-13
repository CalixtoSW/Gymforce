from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import get_redis
from app.models.point_event import PointActionType
from app.models.workout import Exercise, Workout, WorkoutSheet
from app.models.workout_session import (
    PartialReason,
    SessionStatus,
    SetLog,
    SetLogStatus,
    WorkoutSession,
)
from app.services.badge_service import BadgeService
from app.services.challenge_service import ChallengeService
from app.services.gamification_service import GamificationService

BASE_WORKOUT_POINTS = 25
MIN_COMPLETION_FOR_POINTS = 30


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def start(self, user_id: str, sheet_id: str) -> WorkoutSession:
        existing = await self._get_active_session(user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    'Você já tem um treino em andamento. '
                    'Finalize antes de iniciar outro.'
                ),
            )

        sheet = await self._get_sheet(sheet_id, user_id)
        total_planned = sum(ex.sets for ex in sheet.exercises)

        session = WorkoutSession(
            user_id=user_id,
            sheet_id=sheet_id,
            status=SessionStatus.ACTIVE,
            total_sets_planned=total_planned,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def pause(self, session_id: str, user_id: str) -> WorkoutSession:
        session = await self._get_session(session_id, user_id)
        if session.status != SessionStatus.ACTIVE:
            raise HTTPException(status_code=400, detail='Sessão não está ativa')
        session.status = SessionStatus.PAUSED
        session.paused_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def resume(self, session_id: str, user_id: str) -> WorkoutSession:
        session = await self._get_session(session_id, user_id)
        if session.status != SessionStatus.PAUSED:
            raise HTTPException(status_code=400, detail='Sessão não está pausada')

        if session.paused_at:
            paused_at = self._as_utc(session.paused_at)
            pause_duration = int((datetime.now(UTC) - paused_at).total_seconds())
            session.total_pause_seconds += max(pause_duration, 0)

        session.status = SessionStatus.ACTIVE
        session.paused_at = None
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def log_set(self, session_id: str, user_id: str, data: dict) -> SetLog:
        session = await self._get_session(session_id, user_id)
        if session.status not in (SessionStatus.ACTIVE, SessionStatus.PAUSED):
            raise HTTPException(status_code=400, detail='Sessão não está ativa')

        exercise = await self._get_exercise_for_session(session, data['exercise_id'])
        suggested = await self._get_last_weight(user_id, data['exercise_id'])

        status_value = data.get('status', SetLogStatus.COMPLETED.value)
        try:
            set_status = SetLogStatus(status_value)
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail='Status de série inválido'
            ) from exc

        set_log = SetLog(
            session_id=session_id,
            exercise_id=data['exercise_id'],
            set_number=data['set_number'],
            planned_reps=exercise.reps,
            planned_weight_kg=suggested,
            actual_reps=data.get('actual_reps'),
            actual_weight_kg=data.get('actual_weight_kg'),
            status=set_status,
            rest_seconds_taken=data.get('rest_seconds_taken'),
            notes=data.get('notes'),
        )
        self.db.add(set_log)

        if set_status in (
            SetLogStatus.COMPLETED,
            SetLogStatus.PARTIAL,
            SetLogStatus.FAILED,
        ):
            session.total_sets_completed += 1
        elif set_status == SetLogStatus.SKIPPED:
            session.total_sets_skipped += 1

        if session.total_sets_planned > 0:
            raw_pct = int(
                (session.total_sets_completed / session.total_sets_planned) * 100
            )
            session.completion_pct = min(raw_pct, 100)

        await self.db.commit()
        await self.db.refresh(set_log)
        return set_log

    async def finish(
        self,
        session_id: str,
        user_id: str,
        completion_type: str,
        finished_by: str | None = None,
        partial_reason: str | None = None,
        partial_notes: str | None = None,
    ) -> WorkoutSession:
        session = await self._get_session_any_user(session_id)

        actor_id = finished_by or user_id
        if not actor_id:
            raise HTTPException(status_code=403, detail='Sem permissão')

        if user_id and user_id != session.user_id and actor_id == user_id:
            raise HTTPException(status_code=403, detail='Sem permissão')

        if session.status in (
            SessionStatus.COMPLETED,
            SessionStatus.PARTIAL,
            SessionStatus.CANCELLED,
        ):
            raise HTTPException(status_code=400, detail='Sessão já finalizada')

        now = datetime.now(UTC)

        if session.status == SessionStatus.PAUSED and session.paused_at:
            paused_at = self._as_utc(session.paused_at)
            pause_duration = int((now - paused_at).total_seconds())
            session.total_pause_seconds += max(pause_duration, 0)

        session.finished_at = now
        session.finished_by = actor_id

        started_at = self._as_utc(session.started_at)
        active_duration = int((now - started_at).total_seconds())
        active_duration -= session.total_pause_seconds
        session.active_duration_seconds = max(active_duration, 0)

        if session.total_sets_planned > 0 and session.total_sets_completed > 0:
            raw_pct = int(
                (session.total_sets_completed / session.total_sets_planned) * 100
            )
            session.completion_pct = min(raw_pct, 100)

        if completion_type not in {'complete', 'partial'}:
            raise HTTPException(status_code=400, detail='completion_type inválido')

        if session.total_sets_completed == 0:
            session.status = SessionStatus.CANCELLED
            session.partial_reason = None
            session.partial_notes = None
        elif completion_type == 'complete' or session.completion_pct == 100:
            session.status = SessionStatus.COMPLETED
            session.partial_reason = None
            session.partial_notes = None
        else:
            session.status = SessionStatus.PARTIAL
            if not partial_reason:
                raise HTTPException(
                    status_code=400,
                    detail='Motivo obrigatório para conclusão parcial',
                )
            try:
                session.partial_reason = PartialReason(partial_reason)
            except ValueError as exc:
                raise HTTPException(
                    status_code=400, detail='Motivo parcial inválido'
                ) from exc
            session.partial_notes = partial_notes

        if session.completion_pct >= MIN_COMPLETION_FOR_POINTS:
            points = int(BASE_WORKOUT_POINTS * session.completion_pct / 100)
            session.points_earned = max(points, 5)
        else:
            session.points_earned = 0

        duration_minutes = None
        if session.active_duration_seconds and session.active_duration_seconds > 0:
            duration_minutes = max(1, int(session.active_duration_seconds / 60))

        if session.status != SessionStatus.CANCELLED:
            workout = Workout(
                user_id=session.user_id,
                sheet_id=session.sheet_id,
                duration_minutes=duration_minutes,
                points_earned=session.points_earned,
            )
            self.db.add(workout)

        await self.db.commit()

        if session.points_earned > 0:
            try:
                redis = await get_redis()
            except Exception:
                redis = None

            gamification = GamificationService(self.db, redis)
            await gamification.credit_points(
                user_id=session.user_id,
                action_type=PointActionType.WORKOUT_COMPLETE,
                points=session.points_earned,
                description=self._build_description(session),
                ref_id=session.id,
            )

            badge_service = BadgeService(self.db)
            await badge_service.evaluate(session.user_id)
            challenge_service = ChallengeService(self.db)
            await challenge_service.update_progress_for_user(session.user_id)

        await self.db.refresh(session)
        return session

    async def get_active_session(self, user_id: str) -> WorkoutSession | None:
        return await self._get_active_session(user_id)

    async def get_session_detail(self, session_id: str, user_id: str) -> dict:
        session = await self._get_session(session_id, user_id)
        return await self._build_session_detail(session)

    async def get_session_detail_any_user(self, session_id: str) -> dict:
        session = await self._get_session_any_user(session_id)
        return await self._build_session_detail(session)

    async def get_session_history(
        self, user_id: str, skip: int = 0, limit: int = 20
    ) -> list[WorkoutSession]:
        result = await self.db.execute(
            select(WorkoutSession)
            .where(WorkoutSession.user_id == user_id)
            .order_by(desc(WorkoutSession.started_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active_sessions_for_personal(self, personal_id: str) -> list[dict]:
        result = await self.db.execute(
            select(WorkoutSession)
            .options(
                selectinload(WorkoutSession.user),
                selectinload(WorkoutSession.sheet),
            )
            .where(
                WorkoutSession.status.in_(
                    [SessionStatus.ACTIVE, SessionStatus.PAUSED]
                )
            )
            .join(WorkoutSheet, WorkoutSession.sheet_id == WorkoutSheet.id)
            .where(WorkoutSheet.created_by == personal_id)
            .order_by(WorkoutSession.started_at.desc())
        )
        sessions = list(result.scalars().all())

        now = datetime.now(UTC)
        summaries: list[dict] = []
        for active_session in sessions:
            last_log = await self.db.execute(
                select(SetLog)
                .options(selectinload(SetLog.exercise))
                .where(SetLog.session_id == active_session.id)
                .order_by(desc(SetLog.created_at))
                .limit(1)
            )
            last = last_log.scalar_one_or_none()

            started_at = self._as_utc(active_session.started_at)
            elapsed = int((now - started_at).total_seconds() / 60)

            summaries.append(
                {
                    'session_id': active_session.id,
                    'user_id': active_session.user_id,
                    'user_name': (
                        active_session.user.name if active_session.user else '—'
                    ),
                    'sheet_name': (
                        active_session.sheet.name if active_session.sheet else '—'
                    ),
                    'status': active_session.status.value,
                    'started_at': active_session.started_at,
                    'completion_pct': active_session.completion_pct,
                    'current_exercise': (
                        last.exercise.name if last and last.exercise else None
                    ),
                    'elapsed_minutes': elapsed,
                }
            )

        return summaries

    async def get_exercise_weight_history(
        self, user_id: str, exercise_id: str, limit: int = 10
    ) -> list[dict]:
        result = await self.db.execute(
            select(SetLog)
            .join(WorkoutSession, SetLog.session_id == WorkoutSession.id)
            .where(
                and_(
                    WorkoutSession.user_id == user_id,
                    SetLog.exercise_id == exercise_id,
                    SetLog.status.in_([SetLogStatus.COMPLETED, SetLogStatus.PARTIAL]),
                    SetLog.actual_weight_kg.isnot(None),
                )
            )
            .order_by(desc(SetLog.created_at))
            .limit(limit)
        )
        logs = list(result.scalars().all())
        return [
            {
                'set_number': item.set_number,
                'reps': item.actual_reps,
                'weight_kg': (
                    float(item.actual_weight_kg) if item.actual_weight_kg else None
                ),
                'date': str(item.created_at.date()),
            }
            for item in logs
        ]

    async def _get_active_session(self, user_id: str) -> WorkoutSession | None:
        result = await self.db.execute(
            select(WorkoutSession).where(
                and_(
                    WorkoutSession.user_id == user_id,
                    WorkoutSession.status.in_(
                        [SessionStatus.ACTIVE, SessionStatus.PAUSED]
                    ),
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_session(self, session_id: str, user_id: str) -> WorkoutSession:
        session = await self.db.get(WorkoutSession, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail='Sessão não encontrada')
        return session

    async def _get_session_any_user(self, session_id: str) -> WorkoutSession:
        session = await self.db.get(WorkoutSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail='Sessão não encontrada')
        return session

    async def _get_sheet(self, sheet_id: str, user_id: str) -> WorkoutSheet:
        result = await self.db.execute(
            select(WorkoutSheet)
            .options(selectinload(WorkoutSheet.exercises))
            .where(and_(WorkoutSheet.id == sheet_id, WorkoutSheet.user_id == user_id))
        )
        sheet = result.scalar_one_or_none()
        if not sheet:
            raise HTTPException(status_code=404, detail='Ficha não encontrada')
        return sheet

    async def _get_exercise_for_session(
        self, session: WorkoutSession, exercise_id: str
    ) -> Exercise:
        result = await self.db.execute(
            select(Exercise).where(
                and_(Exercise.id == exercise_id, Exercise.sheet_id == session.sheet_id)
            )
        )
        exercise = result.scalar_one_or_none()
        if not exercise:
            raise HTTPException(
                status_code=404, detail='Exercício não encontrado na ficha'
            )
        return exercise

    async def _get_last_weight(self, user_id: str, exercise_id: str) -> float | None:
        result = await self.db.execute(
            select(SetLog.actual_weight_kg)
            .join(WorkoutSession, SetLog.session_id == WorkoutSession.id)
            .where(
                and_(
                    WorkoutSession.user_id == user_id,
                    SetLog.exercise_id == exercise_id,
                    SetLog.actual_weight_kg.isnot(None),
                    SetLog.status.in_([SetLogStatus.COMPLETED, SetLogStatus.PARTIAL]),
                )
            )
            .order_by(desc(SetLog.created_at))
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return float(row) if row else None

    async def _build_session_detail(self, session: WorkoutSession) -> dict:
        sheet_result = await self.db.execute(
            select(WorkoutSheet)
            .options(selectinload(WorkoutSheet.exercises))
            .where(WorkoutSheet.id == session.sheet_id)
        )
        sheet = sheet_result.scalar_one_or_none()
        if not sheet:
            return {}

        logs_result = await self.db.execute(
            select(SetLog)
            .where(SetLog.session_id == session.id)
            .order_by(SetLog.created_at)
        )
        all_logs = list(logs_result.scalars().all())

        logs_by_exercise: dict[str, list[SetLog]] = {}
        for log in all_logs:
            logs_by_exercise.setdefault(log.exercise_id, []).append(log)

        exercises_progress: list[dict] = []
        for exercise in sheet.exercises:
            ex_logs = logs_by_exercise.get(exercise.id, [])
            completed = len(
                [
                    entry
                    for entry in ex_logs
                    if entry.status
                    in (
                        SetLogStatus.COMPLETED,
                        SetLogStatus.PARTIAL,
                        SetLogStatus.FAILED,
                    )
                ]
            )

            suggested = await self._get_last_weight(session.user_id, exercise.id)
            exercises_progress.append(
                {
                    'exercise_id': exercise.id,
                    'exercise_name': exercise.name,
                    'planned_sets': exercise.sets,
                    'planned_reps': exercise.reps,
                    'rest_seconds': exercise.rest_seconds,
                    'suggested_weight_kg': suggested,
                    'sets_completed': completed,
                    'sets_remaining': max(0, exercise.sets - completed),
                    'set_logs': [
                        {
                            'id': entry.id,
                            'exercise_id': entry.exercise_id,
                            'set_number': entry.set_number,
                            'planned_reps': entry.planned_reps,
                            'planned_weight_kg': (
                                float(entry.planned_weight_kg)
                                if entry.planned_weight_kg is not None
                                else None
                            ),
                            'actual_reps': entry.actual_reps,
                            'actual_weight_kg': (
                                float(entry.actual_weight_kg)
                                if entry.actual_weight_kg is not None
                                else None
                            ),
                            'status': entry.status.value,
                            'rest_seconds_taken': entry.rest_seconds_taken,
                            'notes': entry.notes,
                            'created_at': entry.created_at,
                        }
                        for entry in ex_logs
                    ],
                }
            )

        return {
            'id': session.id,
            'user_id': session.user_id,
            'sheet_id': session.sheet_id,
            'sheet_name': sheet.name,
            'status': session.status.value,
            'started_at': session.started_at,
            'paused_at': session.paused_at,
            'finished_at': session.finished_at,
            'active_duration_seconds': session.active_duration_seconds,
            'total_pause_seconds': session.total_pause_seconds,
            'total_sets_planned': session.total_sets_planned,
            'total_sets_completed': session.total_sets_completed,
            'total_sets_skipped': session.total_sets_skipped,
            'completion_pct': session.completion_pct,
            'partial_reason': (
                session.partial_reason.value if session.partial_reason else None
            ),
            'partial_notes': session.partial_notes,
            'finished_by': session.finished_by,
            'points_earned': session.points_earned,
            'exercises_progress': exercises_progress,
        }

    def _build_description(self, session: WorkoutSession) -> str:
        status_label = (
            'Completo' if session.status == SessionStatus.COMPLETED else 'Parcial'
        )
        return (
            f'Treino {status_label} ({session.completion_pct}%) — '
            f'{session.total_sets_completed}/{session.total_sets_planned} séries'
        )

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
