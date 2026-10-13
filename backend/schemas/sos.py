from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SOSCreate(BaseModel):
    user_id: Optional[int] = None
    elder_id: Optional[int] = None
    caller_name: Optional[str] = "CareNest User"
    caller_phone: Optional[str] = None
    location: Optional[str] = "Location shared from device"
    emergency_type: Optional[str] = "Medical Emergency"


class SOSResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    elder_id: Optional[int] = None
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None
    location: Optional[str] = None
    emergency_type: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
