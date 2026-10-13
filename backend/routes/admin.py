from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.database import get_db
from models.user import User
from models.caretaker import Caretaker
from models.booking import Booking
from models.sos import SOSAlert
from models.review import Review


router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_caretakers = db.query(func.count(Caretaker.id)).scalar() or 0
    
    pending_caretakers = db.query(func.count(Caretaker.id)).filter(
        Caretaker.verification_status == "pending"
    ).scalar() or 0
    
    verified_caretakers = db.query(func.count(Caretaker.id)).filter(
        Caretaker.verification_status == "verified"
    ).scalar() or 0

    rejected_caretakers = db.query(func.count(Caretaker.id)).filter(
        Caretaker.verification_status == "rejected"
    ).scalar() or 0

    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    
    confirmed_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status == "confirmed"
    ).scalar() or 0

    completed_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status == "completed"
    ).scalar() or 0

    pending_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status == "pending"
    ).scalar() or 0

    active_sos = db.query(func.count(SOSAlert.id)).filter(
        SOSAlert.status == "active"
    ).scalar() or 0

    total_reviews = db.query(func.count(Review.id)).scalar() or 0

    return {
        "users": {
            "total": total_users
        },
        "caretakers": {
            "total": total_caretakers,
            "pending": pending_caretakers,
            "verified": verified_caretakers,
            "rejected": rejected_caretakers
        },
        "bookings": {
            "total": total_bookings,
            "confirmed": confirmed_bookings,
            "completed": completed_bookings,
            "pending": pending_bookings
        },
        "sos": {
            "active": active_sos
        },
        "reviews": {
            "total": total_reviews
        }
    }
