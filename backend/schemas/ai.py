from pydantic import BaseModel
from typing import List, Optional


class AIRecommendationRequest(BaseModel):
    service_needed: Optional[str] = None
    elder_age: Optional[int] = None
    medical_conditions: Optional[List[str]] = None
    special_requirements: Optional[str] = None
    preferred_language: Optional[str] = None
    min_experience_years: Optional[int] = 0


class CaretakerMatch(BaseModel):
    caretaker_id: int
    full_name: str
    experience_years: int
    skills: Optional[str] = None
    services: Optional[str] = None
    availability: Optional[str] = None
    profile_photo: Optional[str] = None
    match_score: int  # 0 - 100%
    match_reasons: List[str]
    verification_status: str
    is_available: bool


class AIRecommendationResponse(BaseModel):
    total_evaluated: int
    recommendations: List[CaretakerMatch]
    summary_analysis: str
