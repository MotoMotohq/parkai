import json
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..ai import embedding, search
from ..config import DEMO_DIR
from ..database import get_db
from ..models import ParkingLocation

router = APIRouter(prefix="/api", tags=["analytics"])

_last_run: schemas.RunTestOut | None = None  # in-memory cache; fine for a single-process MVP


def _test_manifest() -> list[dict]:
    path = DEMO_DIR / "test_manifest.json"
    return json.loads(path.read_text()) if path.exists() else []


@router.get("/analytics", response_model=schemas.AnalyticsOut)
def get_analytics(db: Session = Depends(get_db)):
    total_locations = db.query(ParkingLocation).count()
    test_cases = _test_manifest()
    if _last_run is None:
        return schemas.AnalyticsOut(
            total_locations=total_locations,
            total_test_images=len(test_cases),
            correct_matches=0,
            top1_accuracy=0.0,
            average_search_time_ms=0.0,
            is_demo_benchmark=True,
        )
    return _last_run.analytics


@router.post("/analytics/run", response_model=schemas.RunTestOut)
def run_ai_test(db: Session = Depends(get_db)):
    global _last_run
    test_cases = _test_manifest()
    if not test_cases:
        raise HTTPException(500, "Test dataset not seeded yet — run app.seed.generate_dataset")

    all_locations = db.query(ParkingLocation).all()
    location_by_id = {loc.id: loc for loc in all_locations}
    candidates = [(loc, loc.embedding) for loc in all_locations]

    results: list[schemas.TestCaseResult] = []
    correct = 0
    total_time_ms = 0.0

    for case in test_cases:
        t0 = time.time()
        image_path = DEMO_DIR / Path(case["image_url"]).name
        image_bytes = image_path.read_bytes()

        expected_loc = location_by_id.get(case["expected_location_id"])
        query_landmarks = expected_loc.landmarks if expected_loc else []

        query_embedding = embedding.create_embedding(image_bytes)
        ranked = search.rank_candidates(query_embedding, candidates)

        scored = []
        for loc, visual_sim in ranked:
            _, ratio = search.landmark_match(query_landmarks, loc.landmarks)
            scored.append((loc, search.combined_score(visual_sim, ratio)))
        scored.sort(key=lambda item: -item[1])
        predicted_loc, predicted_score = scored[0]

        total_time_ms += (time.time() - t0) * 1000
        is_correct = predicted_loc.id == case["expected_location_id"]
        correct += int(is_correct)

        results.append(
            schemas.TestCaseResult(
                test_id=case["test_id"],
                expected_location=case["expected_label"],
                predicted_location=f"{predicted_loc.floor}/{predicted_loc.parking_number}",
                similarity=predicted_score,
                correct=is_correct,
            )
        )

    analytics = schemas.AnalyticsOut(
        total_locations=len(all_locations),
        total_test_images=len(test_cases),
        correct_matches=correct,
        top1_accuracy=(correct / len(test_cases)) if test_cases else 0.0,
        average_search_time_ms=(total_time_ms / len(test_cases)) if test_cases else 0.0,
        is_demo_benchmark=True,
    )
    _last_run = schemas.RunTestOut(results=results, analytics=analytics)
    return _last_run
