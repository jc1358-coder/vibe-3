from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.db.sqlite import SCHEDULE_TYPES


class ScheduleBase(BaseModel):
    member_id: int
    schedule_type: str = Field(min_length=1, max_length=20)
    title: str = Field(min_length=1, max_length=160)
    start_at: str = Field(min_length=1, max_length=40)
    end_at: str = Field(min_length=1, max_length=40)
    memo: str | None = Field(default=None, max_length=500)

    @field_validator("schedule_type")
    @classmethod
    def validate_schedule_type(cls, value: str) -> str:
        if value not in SCHEDULE_TYPES:
            allowed = ", ".join(sorted(SCHEDULE_TYPES))
            raise ValueError(f"일정 유형은 {allowed} 중 하나여야 합니다.")
        return value

    @field_validator("title", "start_at", "end_at")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("공백만 입력할 수 없습니다.")
        return stripped

    @field_validator("memo")
    @classmethod
    def normalize_memo(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_time_range(self) -> "ScheduleBase":
        if self.end_at < self.start_at:
            raise ValueError("종료 일시는 시작 일시보다 빠를 수 없습니다.")
        return self


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(ScheduleBase):
    pass


class Schedule(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_name: str
    department: str
    position: str
    created_at: str
    updated_at: str