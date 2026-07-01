from fastapi import APIRouter

from app.api.routes import complaints, excel, health, news, schedules

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(excel.router, prefix="/excel", tags=["excel"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
