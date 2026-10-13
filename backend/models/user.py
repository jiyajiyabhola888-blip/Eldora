from sqlalchemy import Column, Integer, String, Boolean
from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, index=True, nullable=False)

    phone = Column(String(20), nullable=True)

    password = Column(String(255), nullable=False)

    role = Column(String(30), default="family")

    is_active = Column(Boolean, default=True)