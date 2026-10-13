from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=True)
    caretaker_id = Column(Integer, ForeignKey("caretakers.id"), nullable=True)

    service = Column(String(100), nullable=False)
    duration = Column(String(50), nullable=False)
    booking_date = Column(String(30), nullable=False)
    booking_time = Column(String(30), nullable=False)
    address = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    price = Column(String(30), nullable=False)
    status = Column(String(30), default="confirmed")