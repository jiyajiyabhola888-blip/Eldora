from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from models.sos import SOSAlert
from models.notification import Notification
from schemas.sos import SOSCreate, SOSResponse


router = APIRouter(
    prefix="/sos",
    tags=["Emergency SOS"]
)


@router.post("/", response_model=SOSResponse)
def trigger_sos(
    sos_data: SOSCreate,
    db: Session = Depends(get_db)
):
    new_sos = SOSAlert(
        user_id=sos_data.user_id,
        elder_id=sos_data.elder_id,
        caller_name=sos_data.caller_name or "CareNest Elder / Family",
        caller_phone=sos_data.caller_phone or "Emergency Contact",
        location=sos_data.location or "Live location shared",
        emergency_type=sos_data.emergency_type or "Medical Emergency",
        status="active"
    )

    db.add(new_sos)
    db.commit()
    db.refresh(new_sos)

    # In-app notification for admin/team
    admin_notif = Notification(
        recipient_type="admin",
        recipient_id=None,
        title="EMERGENCY SOS ALERT 🚨",
        message=f"SOS alert #{new_sos.id} triggered by {new_sos.caller_name} at {new_sos.location}."
    )
    db.add(admin_notif)
    db.commit()

    return new_sos


@router.get("/", response_model=List[SOSResponse])
def get_sos_alerts(
    db: Session = Depends(get_db)
):
    return db.query(SOSAlert).order_by(SOSAlert.id.desc()).all()


@router.put("/{sos_id}/resolve", response_model=SOSResponse)
def resolve_sos_alert(
    sos_id: int,
    db: Session = Depends(get_db)
):
    sos = db.query(SOSAlert).filter(SOSAlert.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS Alert not found")

    sos.status = "resolved"
    db.commit()
    db.refresh(sos)
    return sos
