from pydantic import BaseModel, ConfigDict, Field, field_validator


class MemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    department: str = Field(min_length=1, max_length=120)
    position: str = Field(min_length=1, max_length=80)

    @field_validator("name", "department", "position")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("공백만 입력할 수 없습니다.")
        return stripped


class MemberCreate(MemberBase):
    pass


class MemberUpdate(MemberBase):
    pass


class Member(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str
    updated_at: str