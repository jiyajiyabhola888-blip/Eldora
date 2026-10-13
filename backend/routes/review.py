from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from models.review import Review
from models.booking import Booking
from models.caretaker import Caretaker
from models.user import User
from schemas.review import ReviewCreate, ReviewResponse


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews & Ratings"]
)


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db)
):
    # Verify booking exists
    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Reviews can only be submitted for completed bookings"
        )

    # Check for existing review on this booking
    existing = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A review has already been submitted for this booking"
        )

    # Verify caretaker
    caretaker = db.query(Caretaker).filter(Caretaker.id == review_data.caretaker_id).first()
    if not caretaker:
        raise HTTPException(status_code=404, detail="Caretaker not found")

    new_review = Review(
        booking_id=review_data.booking_id,
        caretaker_id=review_data.caretaker_id,
        user_id=review_data.user_id,
        rating=review_data.rating,
        comment=review_data.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # Fetch user name for response
    user = db.query(User).filter(User.id == new_review.user_id).first()
    user_name = user.full_name if user else "Family Member"

    return {
        "id": new_review.id,
        "booking_id": new_review.booking_id,
        "caretaker_id": new_review.caretaker_id,
        "user_id": new_review.user_id,
        "rating": new_review.rating,
        "comment": new_review.comment,
        "created_at": new_review.created_at,
        "user_name": user_name
    }


@router.get("/caretaker/{caretaker_id}", response_model=List[ReviewResponse])
def get_caretaker_reviews(
    caretaker_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.caretaker_id == caretaker_id
    ).order_by(Review.id.desc()).all()

    result = []
    for r in reviews:
        u = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id": r.id,
            "booking_id": r.booking_id,
            "caretaker_id": r.caretaker_id,
            "user_id": r.user_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "user_name": u.full_name if u else "CareNest Family"
        })
    return result
