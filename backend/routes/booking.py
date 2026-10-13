import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from models.booking import Booking
from models.caretaker import Caretaker
from models.user import User
from models.elder import Elder
from models.notification import Notification
from schemas.booking import BookingCreate, BookingStatusUpdate, BookingResponse


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


def parse_duration_hours(duration_str: str) -> float:
    """
    Parses duration string to hours.
    Examples: '4 Hours' -> 4.0, '2' -> 2.0, '1 Day' -> 24.0, '1 Month' -> 720.0
    """
    if not duration_str:
        return 0.0
    
    d_lower = duration_str.lower().strip()
    
    if "month" in d_lower:
        match = re.search(r"(\d+(\.\d+)?)", d_lower)
        num = float(match.group(1)) if match else 1.0
        return num * 24.0 * 30.0
    elif "day" in d_lower:
        match = re.search(r"(\d+(\.\d+)?)", d_lower)
        num = float(match.group(1)) if match else 1.0
        return num * 24.0
    elif "year" in d_lower:
        match = re.search(r"(\d+(\.\d+)?)", d_lower)
        num = float(match.group(1)) if match else 1.0
        return num * 24.0 * 365.0
    else:
        # Default assume hours
        match = re.search(r"(\d+(\.\d+)?)", d_lower)
        if match:
            return float(match.group(1))
        return 4.0  # fallback standard


def enrich_booking(b: Booking, db: Session) -> dict:
    caretaker_name = None
    if b.caretaker_id:
        c = db.query(Caretaker).filter(Caretaker.id == b.caretaker_id).first()
        if c:
            caretaker_name = c.full_name

    elder_name = None
    if b.elder_id:
        e = db.query(Elder).filter(Elder.id == b.elder_id).first()
        if e:
            elder_name = e.name

    user_name = None
    user_phone = None
    if b.user_id:
        u = db.query(User).filter(User.id == b.user_id).first()
        if u:
            user_name = u.full_name
            user_phone = u.phone

    return {
        "id": b.id,
        "user_id": b.user_id,
        "elder_id": b.elder_id,
        "caretaker_id": b.caretaker_id,
        "service": b.service,
        "duration": b.duration,
        "booking_date": b.booking_date,
        "booking_time": b.booking_time,
        "address": b.address,
        "special_instructions": b.special_instructions,
        "price": b.price,
        "status": b.status,
        "caretaker_name": caretaker_name,
        "elder_name": elder_name,
        "user_name": user_name,
        "user_phone": user_phone
    }


@router.post("/", response_model=BookingResponse)
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db)
):
    # 1. Enforce Minimum 4 Hours Rule
    hours = parse_duration_hours(booking.duration)
    if hours < 4.0:
        raise HTTPException(
            status_code=400,
            detail="Minimum caretaker duty duration is 4 hours. Please select 4 hours or more."
        )

    # 2. Caretaker validation if assigned
    caretaker = None
    if booking.caretaker_id:
        caretaker = db.query(Caretaker).filter(
            Caretaker.id == booking.caretaker_id
        ).first()

        if not caretaker:
            raise HTTPException(
                status_code=404,
                detail="Selected caretaker does not exist"
            )

        if caretaker.verification_status != "verified":
            raise HTTPException(
                status_code=400,
                detail="Selected caretaker is pending verification and cannot accept bookings yet."
            )

        if not caretaker.is_available:
            raise HTTPException(
                status_code=400,
                detail="Selected caretaker is currently marked unavailable."
            )

        # 3. Check for conflicting booking on same date and time
        conflict = db.query(Booking).filter(
            Booking.caretaker_id == booking.caretaker_id,
            Booking.booking_date == booking.booking_date,
            Booking.booking_time == booking.booking_time,
            Booking.status.in_(["confirmed", "pending"])
        ).first()

        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Caretaker already has a confirmed booking on {booking.booking_date} at {booking.booking_time}."
            )

    # Resolve user_id if null
    resolved_user_id = booking.user_id or 1

    new_booking = Booking(
        user_id=resolved_user_id,
        elder_id=booking.elder_id,
        caretaker_id=booking.caretaker_id,
        service=booking.service,
        duration=booking.duration,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        address=booking.address,
        special_instructions=booking.special_instructions,
        price=booking.price,
        status=booking.status or "confirmed"
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Send Notification to Caretaker
    if booking.caretaker_id:
        notif = Notification(
            recipient_type="caretaker",
            recipient_id=booking.caretaker_id,
            title="New Booking Received 📅",
            message=f"You have a new booking for '{booking.service}' on {booking.booking_date} at {booking.booking_time}."
        )
        db.add(notif)

    # Send Notification to User
    user_notif = Notification(
        recipient_type="user",
        recipient_id=resolved_user_id,
        title="Booking Confirmation 🎉",
        message=f"Your booking for '{booking.service}' on {booking.booking_date} is confirmed."
    )
    db.add(user_notif)
    db.commit()

    return enrich_booking(new_booking, db)


@router.get("/", response_model=List[BookingResponse])
def get_all_bookings(
    status: Optional[str] = Query(None, description="Filter by booking status"),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    bookings = query.order_by(Booking.id.desc()).all()
    return [enrich_booking(b, db) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return enrich_booking(booking, db)


@router.get("/user/{user_id}", response_model=List[BookingResponse])
def get_user_bookings(
    user_id: int,
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.user_id == user_id
    ).order_by(Booking.id.desc()).all()

    return [enrich_booking(b, db) for b in bookings]


@router.get("/elder/{elder_id}", response_model=List[BookingResponse])
def get_elder_bookings(
    elder_id: int,
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.elder_id == elder_id
    ).order_by(Booking.id.desc()).all()

    return [enrich_booking(b, db) for b in bookings]


@router.get("/caretaker/{caretaker_id}", response_model=List[BookingResponse])
def get_caretaker_bookings(
    caretaker_id: int,
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.caretaker_id == caretaker_id
    ).order_by(Booking.id.desc()).all()

    return [enrich_booking(b, db) for b in bookings]


@router.put("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    status = status_update.status.lower().strip()
    valid_statuses = ["pending", "confirmed", "completed", "cancelled", "rejected"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking.status = status
    db.commit()
    db.refresh(booking)

    # Send Notification to User regarding status
    user_notif = Notification(
        recipient_type="user",
        recipient_id=booking.user_id,
        title=f"Booking Status: {status.capitalize()}",
        message=f"Your booking #{booking.id} for {booking.service} is now marked as {status}."
    )
    db.add(user_notif)
    db.commit()

    return enrich_booking(booking, db)


@router.delete("/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    db.delete(booking)
    db.commit()

    return {"message": "Booking deleted successfully", "id": booking_id}