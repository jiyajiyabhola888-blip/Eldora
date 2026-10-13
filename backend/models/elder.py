from sqlalchemy import Column, Integer, String, Text
from database.database import Base


class Elder(Base):
    __tablename__ = "elders"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(20), nullable=False)

    medical_conditions = Column(Text, nullable=True)
    medicines = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)

    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    care_requirements = Column(Text, nullable=True)