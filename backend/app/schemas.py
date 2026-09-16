from datetime import datetime

from pydantic import BaseModel


class LandmarkOut(BaseModel):
    type: str
    value: str
    confidence: float
    matched: bool = False


class ParkingLocationOut(BaseModel):
    id: str
    floor: str
    zone: str
    row: int
    parking_number: str
    image_url: str
    landmarks: list[LandmarkOut]
    is_demo: bool
    created_at: datetime


class SaveResultOut(BaseModel):
    location: ParkingLocationOut
    confidence: float
    detected_landmarks: list[LandmarkOut]


class CandidateOut(BaseModel):
    location: ParkingLocationOut
    similarity: float


class SearchResultOut(BaseModel):
    search_id: str
    query_image_url: str
    candidates: list[CandidateOut]
    best_match: CandidateOut | None
    matched_landmarks: list[LandmarkOut]
    locations_analyzed: int
    search_time_ms: int


class AnalyticsOut(BaseModel):
    total_locations: int
    total_test_images: int
    correct_matches: int
    top1_accuracy: float
    average_search_time_ms: float
    is_demo_benchmark: bool


class TestCaseResult(BaseModel):
    test_id: str
    expected_location: str
    predicted_location: str
    similarity: float
    correct: bool


class RunTestOut(BaseModel):
    results: list[TestCaseResult]
    analytics: AnalyticsOut
