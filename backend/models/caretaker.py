from sqlalchemy import Column, Integer, String, Text, Boolean
from database.database import Base


class Caretaker(Base):
    __tablename__ = "caretakers"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    phone = Column(String(20), nullable=False)

    experience_years = Column(Integer, default=0)

    skills = Column(Text, nullable=True)

    services = Column(Text, nullable=True)

    availability = Column(String(100), nullable=True)

    verification_status = Column(String(30), default="pending")

    is_available = Column(Boolean, default=True)

    profile_photo = Column(String(255), nullable=True)