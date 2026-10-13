from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from models.elder import Elder
from schemas.elder import ElderCreate, ElderResponse


router = APIRouter(
    prefix="/elders",
    tags=["Elders"]
)


@router.post("/", response_model=ElderResponse)
def create_elder(
    elder: ElderCreate,
    db: Session = Depends(get_db)
):
    new_elder = Elder(
        name=elder.name,
        age=elder.age,
        gender=elder.gender,
        phone=elder.phone,
        medical_conditions=elder.medical_conditions,
        medicines=elder.medicines,
        allergies=elder.allergies,
        emergency_contact_name=elder.emergency_contact_name,
        emergency_contact_phone=elder.emergency_contact_phone,
        care_requirements=elder.care_requirements
    )

    db.add(new_elder)
    db.commit()
    db.refresh(new_elder)

    return new_elder


@router.get("/", response_model=List[ElderResponse])
def get_all_elders(
    db: Session = Depends(get_db)
):
    return db.query(Elder).all()


@router.get("/{elder_id}", response_model=ElderResponse)
def get_elder(
    elder_id: int,
    db: Session = Depends(get_db)
):
    elder = db.query(Elder).filter(
        Elder.id == elder_id
    ).first()

    if not elder:
        raise HTTPException(
            status_code=404,
            detail="Elder not found"
        )

    return elder


@router.put("/{elder_id}", response_model=ElderResponse)
def update_elder(
    elder_id: int,
    elder_data: ElderCreate,
    db: Session = Depends(get_db)
):
    elder = db.query(Elder).filter(
        Elder.id == elder_id
    ).first()

    if not elder:
        raise HTTPException(
            status_code=404,
            detail="Elder not found"
        )

    elder.name = elder_data.name
    elder.age = elder_data.age
    elder.gender = elder_data.gender
    elder.phone = elder_data.phone
    elder.medical_conditions = elder_data.medical_conditions
    elder.medicines = elder_data.medicines
    elder.allergies = elder_data.allergies
    elder.emergency_contact_name = elder_data.emergency_contact_name
    elder.emergency_contact_phone = elder_data.emergency_contact_phone
    elder.care_requirements = elder_data.care_requirements

    db.commit()
    db.refresh(elder)

    return elder