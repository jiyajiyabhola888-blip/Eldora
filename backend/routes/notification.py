from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from models.notification import Notification
from schemas.notification import NotificationCreate, NotificationResponse


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.post("/", response_model=NotificationResponse)
def create_notification(
    notif: NotificationCreate,
    db: Session = Depends(get_db)
):
    new_notif = Notification(
        recipient_type=notif.recipient_type,
        recipient_id=notif.recipient_id,
        title=notif.title,
        message=notif.message,
        is_read=False
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    recipient_type: Optional[str] = None,
    recipient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if recipient_type:
        query = query.filter(Notification.recipient_type == recipient_type)
    if recipient_id:
        query = query.filter(Notification.recipient_id == recipient_id)
    return query.order_by(Notification.id.desc()).limit(20).all()


@router.put("/{notif_id}/read", response_model=NotificationResponse)
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
