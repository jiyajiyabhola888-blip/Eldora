from pydantic import BaseModel
from typing import Optional


class CaretakerCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    experience_years: int = 0
    skills: Optional[str] = None
    services: Optional[str] = None
    availability: Optional[str] = None
    verification_status: str = "pending"
    is_available: bool = True
    profile_photo: Optional[str] = None


class CaretakerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[str] = None
    services: Optional[str] = None
    availability: Optional[str] = None
    verification_status: Optional[str] = None
    is_available: Optional[bool] = None
    profile_photo: Optional[str] = None


class CaretakerVerificationUpdate(BaseModel):
    verification_status: str  # pending, verified, rejected


class CaretakerResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    experience_years: int
    skills: Optional[str] = None
    services: Optional[str] = None
    availability: Optional[str] = None
    verification_status: str
    is_available: bool
    profile_photo: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None

    class Config:
        from_attributes = True