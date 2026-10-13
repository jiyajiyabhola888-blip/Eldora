from pydantic import BaseModel
from typing import Optional


class BookingCreate(BaseModel):
    user_id: Optional[int] = None
    elder_id: Optional[int] = None
    caretaker_id: Optional[int] = None
    service: str
    duration: str
    booking_date: str
    booking_time: str
    address: Optional[str] = None
    special_instructions: Optional[str] = None
    price: str
    status: str = "pending"  # default to pending or confirmed


class BookingStatusUpdate(BaseModel):
    status: str  # pending, confirmed, completed, cancelled, rejected


class BookingResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    elder_id: Optional[int] = None
    caretaker_id: Optional[int] = None
    service: str
    duration: str
    booking_date: str
    booking_time: str
    address: Optional[str] = None
    special_instructions: Optional[str] = None
    price: str
    status: str
    caretaker_name: Optional[str] = None
    elder_name: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True