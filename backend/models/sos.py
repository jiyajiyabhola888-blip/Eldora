from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from datetime import datetime
from database.database import Base


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=True)
    caller_name = Column(String(100), nullable=True)
    caller_phone = Column(String(30), nullable=True)
    location = Column(String(255), nullable=True)
    emergency_type = Column(String(100), default="Medical Emergency")
    status = Column(String(30), default="active")  # active, responded, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
