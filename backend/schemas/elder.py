from pydantic import BaseModel
from typing import Optional


class ElderCreate(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    phone: Optional[str] = None

    medical_conditions: Optional[str] = None
    medicines: Optional[str] = None
    allergies: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    care_requirements: Optional[str] = None


class ElderResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: Optional[str] = None
    phone: Optional[str] = None

    medical_conditions: Optional[str] = None
    medicines: Optional[str] = None
    allergies: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    care_requirements: Optional[str] = None

    class Config:
        from_attributes = True