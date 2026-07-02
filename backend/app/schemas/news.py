from pydantic import BaseModel, Field, field_validator


class NewsCollectRequest(BaseModel):
    target_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("target_date")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("날짜를 입력해야 합니다.")
        return stripped


class NewsArticle(BaseModel):
    id: int
    source: str
    title: str
    url: str
    summary: str | None
    published_at: str
    collected_date: str
    collected_at: str


class NewsCollectRun(BaseModel):
    id: int
    source: str
    collect_date: str
    mode: str
    status: str
    started_at: str
    ended_at: str | None
    error_message: str | None
