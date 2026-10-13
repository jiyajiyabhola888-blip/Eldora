from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_type = Column(String(30), default="user")  # user, caretaker, admin
    recipient_id = Column(Integer, nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
