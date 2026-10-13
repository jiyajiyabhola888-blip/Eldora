from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database.database import get_db
from models.caretaker import Caretaker
from models.review import Review
from models.notification import Notification
from schemas.caretaker import (
    CaretakerCreate,
    CaretakerUpdate,
    CaretakerVerificationUpdate,
    CaretakerResponse
)


router = APIRouter(
    prefix="/caretakers",
    tags=["Caretakers"]
)


def enrich_caretaker_data(caretaker: Caretaker, db: Session) -> dict:
    rating_data = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("total_reviews")
    ).filter(Review.caretaker_id == caretaker.id).first()

    avg_rating = round(float(rating_data.avg_rating), 1) if rating_data and rating_data.avg_rating else 4.9
    total_reviews = rating_data.total_reviews if rating_data and rating_data.total_reviews else 0

    return {
        "id": caretaker.id,
        "full_name": caretaker.full_name,
        "email": caretaker.email,
        "phone": caretaker.phone,
        "experience_years": caretaker.experience_years,
        "skills": caretaker.skills,
        "services": caretaker.services,
        "availability": caretaker.availability,
        "verification_status": caretaker.verification_status,
        "is_available": caretaker.is_available,
        "profile_photo": caretaker.profile_photo,
        "rating": avg_rating,
        "reviews_count": total_reviews
    }


@router.post("/", response_model=CaretakerResponse)
def create_caretaker(
    caretaker: CaretakerCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Caretaker).filter(
        Caretaker.email == caretaker.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Caretaker with this email already exists"
        )

    new_caretaker = Caretaker(
        full_name=caretaker.full_name,
        email=caretaker.email,
        phone=caretaker.phone,
        experience_years=caretaker.experience_years,
        skills=caretaker.skills,
        services=caretaker.services,
        availability=caretaker.availability,
        verification_status=caretaker.verification_status,
        is_available=caretaker.is_available,
        profile_photo=caretaker.profile_photo
    )

    db.add(new_caretaker)
    db.commit()
    db.refresh(new_caretaker)

    # In-app notification
    notification = Notification(
        recipient_type="caretaker",
        recipient_id=new_caretaker.id,
        title="Welcome to CareNest!",
        message="Your profile has been submitted and is currently pending verification by our admin team."
    )
    db.add(notification)
    db.commit()

    return enrich_caretaker_data(new_caretaker, db)


@router.get("/", response_model=List[CaretakerResponse])
def get_caretakers(
    service: Optional[str] = Query(None, description="Filter by service name (e.g. 'Home Care', 'Hospital Care')"),
    search: Optional[str] = Query(None, description="Search by name or skills"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status (verified, pending, rejected)"),
    is_available: Optional[bool] = Query(None, description="Filter by availability flag"),
    db: Session = Depends(get_db)
):
    query = db.query(Caretaker)

    if verification_status:
        query = query.filter(Caretaker.verification_status == verification_status)

    if is_available is not None:
        query = query.filter(Caretaker.is_available == is_available)

    if service and service.lower() != "all":
        query = query.filter(Caretaker.services.ilike(f"%{service}%"))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Caretaker.full_name.ilike(search_term)) |
            (Caretaker.skills.ilike(search_term)) |
            (Caretaker.services.ilike(search_term))
        )

    caretakers = query.all()
    return [enrich_caretaker_data(c, db) for c in caretakers]


@router.get("/{caretaker_id}", response_model=CaretakerResponse)
def get_caretaker(
    caretaker_id: int,
    db: Session = Depends(get_db)
):
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id
    ).first()

    if not caretaker:
        raise HTTPException(
            status_code=404,
            detail="Caretaker not found"
        )

    return enrich_caretaker_data(caretaker, db)


@router.put("/{caretaker_id}", response_model=CaretakerResponse)
def update_caretaker(
    caretaker_id: int,
    update_data: CaretakerUpdate,
    db: Session = Depends(get_db)
):
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id
    ).first()

    if not caretaker:
        raise HTTPException(
            status_code=404,
            detail="Caretaker not found"
        )

    # If email changed, ensure no duplicate
    if update_data.email and update_data.email != caretaker.email:
        duplicate = db.query(Caretaker).filter(
            Caretaker.email == update_data.email,
            Caretaker.id != caretaker_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Another caretaker is already registered with this email"
            )
        caretaker.email = update_data.email

    if update_data.full_name is not None:
        caretaker.full_name = update_data.full_name
    if update_data.phone is not None:
        caretaker.phone = update_data.phone
    if update_data.experience_years is not None:
        caretaker.experience_years = update_data.experience_years
    if update_data.skills is not None:
        caretaker.skills = update_data.skills
    if update_data.services is not None:
        caretaker.services = update_data.services
    if update_data.availability is not None:
        caretaker.availability = update_data.availability
    if update_data.profile_photo is not None:
        caretaker.profile_photo = update_data.profile_photo
    if update_data.is_available is not None:
        caretaker.is_available = update_data.is_available
    if update_data.verification_status is not None:
        caretaker.verification_status = update_data.verification_status

    db.commit()
    db.refresh(caretaker)

    return enrich_caretaker_data(caretaker, db)


@router.put("/{caretaker_id}/availability", response_model=CaretakerResponse)
def update_caretaker_availability(
    caretaker_id: int,
    is_available: bool,
    db: Session = Depends(get_db)
):
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id
    ).first()

    if not caretaker:
        raise HTTPException(
            status_code=404,
            detail="Caretaker not found"
        )

    caretaker.is_available = is_available

    db.commit()
    db.refresh(caretaker)

    return enrich_caretaker_data(caretaker, db)


@router.put("/{caretaker_id}/verification", response_model=CaretakerResponse)
def update_caretaker_verification(
    caretaker_id: int,
    verification: CaretakerVerificationUpdate,
    db: Session = Depends(get_db)
):
    status = verification.verification_status.lower().strip()
    if status not in ["pending", "verified", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Verification status must be 'pending', 'verified', or 'rejected'"
        )

    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id
    ).first()

    if not caretaker:
        raise HTTPException(
            status_code=404,
            detail="Caretaker not found"
        )

    caretaker.verification_status = status
    db.commit()
    db.refresh(caretaker)

    # Send in-app notification
    msg = f"Your caretaker profile has been {status} by the admin team."
    if status == "verified":
        msg = "Congratulations! Your profile has been verified. You can now receive elder care bookings."
    elif status == "rejected":
        msg = "Your profile verification was rejected. Please review and update your credentials."

    notif = Notification(
        recipient_type="caretaker",
        recipient_id=caretaker.id,
        title=f"Profile Verification {status.capitalize()}",
        message=msg
    )
    db.add(notif)
    db.commit()

    return enrich_caretaker_data(caretaker, db)


@router.delete("/{caretaker_id}")
def delete_caretaker(
    caretaker_id: int,
    db: Session = Depends(get_db)
):
    caretaker = db.query(Caretaker).filter(
        Caretaker.id == caretaker_id
    ).first()

    if not caretaker:
        raise HTTPException(
            status_code=404,
            detail="Caretaker not found"
        )

    db.delete(caretaker)
    db.commit()

    return {"message": "Caretaker deleted successfully", "id": caretaker_id}