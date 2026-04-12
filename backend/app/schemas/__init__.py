from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.badge import BadgeListResponse, BadgeResponse
from app.schemas.checkin import CheckinQRPayload, CheckinResponse, QRCodeResponse
from app.schemas.dashboard import CheckinsByDay, CheckinsByHour, DashboardKPIs
from app.schemas.gamification import (
    GamificationSummary,
    LeaderboardEntry,
    LeaderboardResponse,
    PointEventResponse,
    StreakResponse,
)
from app.schemas.health import HealthResponse
from app.schemas.notification import (
    PushTokenRegister,
    PushTokenResponse,
    SendNotificationRequest,
)
from app.schemas.payment import (
    CreatePixPaymentRequest,
    MembershipResponse,
    PaymentResponse,
    PixPaymentResponse,
)
from app.schemas.plan import PlanCreate, PlanResponse
from app.schemas.reward import (
    RedemptionResponse,
    RewardCreate,
    RewardResponse,
    RewardUpdate,
)
from app.schemas.user import UserAdminUpdate, UserResponse, UserUpdate
from app.schemas.workout import (
    ExerciseCreate,
    ExerciseResponse,
    WorkoutComplete,
    WorkoutResponse,
    WorkoutSheetCreate,
    WorkoutSheetResponse,
)

__all__ = [
    "HealthResponse",
    "CheckinQRPayload",
    "CheckinResponse",
    "QRCodeResponse",
    "DashboardKPIs",
    "CheckinsByHour",
    "CheckinsByDay",
    "PointEventResponse",
    "StreakResponse",
    "LeaderboardEntry",
    "LeaderboardResponse",
    "GamificationSummary",
    "LoginRequest",
    "MessageResponse",
    "RefreshRequest",
    "RegisterRequest",
    "TokenResponse",
    "BadgeResponse",
    "BadgeListResponse",
    "PlanCreate",
    "PlanResponse",
    "PushTokenRegister",
    "PushTokenResponse",
    "SendNotificationRequest",
    "CreatePixPaymentRequest",
    "PixPaymentResponse",
    "PaymentResponse",
    "MembershipResponse",
    "RewardCreate",
    "RewardUpdate",
    "RewardResponse",
    "RedemptionResponse",
    "ExerciseCreate",
    "ExerciseResponse",
    "WorkoutComplete",
    "WorkoutResponse",
    "WorkoutSheetCreate",
    "WorkoutSheetResponse",
    "UserAdminUpdate",
    "UserResponse",
    "UserUpdate",
]
