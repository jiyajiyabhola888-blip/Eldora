from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    recipient_type: str = "user"  # user, caretaker, admin
    recipient_id: Optional[int] = None
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    recipient_type: str
    recipient_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
