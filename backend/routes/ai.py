from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from models.caretaker import Caretaker
from schemas.ai import AIRecommendationRequest, AIRecommendationResponse, CaretakerMatch


router = APIRouter(
    prefix="/ai",
    tags=["AI Matching & Recommendations"]
)


@router.post("/recommend-caretakers", response_model=AIRecommendationResponse)
def recommend_caretakers(
    req: AIRecommendationRequest,
    db: Session = Depends(get_db)
):
    caretakers = db.query(Caretaker).all()
    results: List[CaretakerMatch] = []

    req_service = (req.service_needed or "").lower()
    req_conditions = [c.lower().strip() for c in (req.medical_conditions or [])]
    req_special = (req.special_requirements or "").lower()
    req_lang = (req.preferred_language or "").lower()
    min_exp = req.min_experience_years or 0

    for c in caretakers:
        score = 50  # Base compatibility
        reasons = []

        c_skills = (c.skills or "").lower()
        c_services = (c.services or "").lower()
        c_avail = (c.availability or "").lower()

        # 1. Verification bonus
        if c.verification_status == "verified":
            score += 15
            reasons.append("✔ Background verified professional")
        else:
            score -= 10
            reasons.append("⚠️ Verification pending")

        # 2. Availability bonus
        if c.is_available:
            score += 10
            reasons.append("✔ Currently available for assignments")
        else:
            score -= 20
            reasons.append("⚠️ Currently unavailable")

        # 3. Service Match
        if req_service and (req_service in c_services or req_service in c_skills):
            score += 20
            reasons.append(f"✔ Explicitly provides {req.service_needed}")
        elif req_service:
            # Partial match
            score += 5

        # 4. Experience rating
        if c.experience_years >= min_exp:
            score += 10
            reasons.append(f"✔ {c.experience_years}+ years of field caregiving experience")
        else:
            score -= 5

        # 5. Medical Conditions matching
        matched_conditions = []
        for cond in req_conditions:
            if cond and (cond in c_skills or cond in c_services):
                matched_conditions.append(cond)
        if matched_conditions:
            score += 15
            reasons.append(f"✔ Trained in handling: {', '.join(matched_conditions)}")

        # 6. Language matching
        if req_lang and (req_lang in c_skills or req_lang in c_avail):
            score += 5
            reasons.append(f"✔ Fluent in {req.preferred_language}")

        # Clamp score between 10 and 99
        final_score = max(15, min(98, score))

        results.append(CaretakerMatch(
            caretaker_id=c.id,
            full_name=c.full_name,
            experience_years=c.experience_years,
            skills=c.skills,
            services=c.services,
            availability=c.availability,
            profile_photo=c.profile_photo,
            match_score=final_score,
            match_reasons=reasons,
            verification_status=c.verification_status,
            is_available=c.is_available
        ))

    # Sort descending by match score
    results.sort(key=lambda x: x.match_score, reverse=True)

    summary = (
        f"Analyzed {len(caretakers)} caretakers against care criteria. "
        f"Top match '{results[0].full_name if results else 'None'}' scored "
        f"{results[0].match_score if results else 0}% compatibility score based on service expertise and verified background."
    )

    return AIRecommendationResponse(
        total_evaluated=len(caretakers),
        recommendations=results,
        summary_analysis=summary
    )
