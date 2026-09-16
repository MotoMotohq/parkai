import json
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..ai import embedding, search
from ..config import DEMO_DIR
from ..database import get_db
from ..models import ParkingLocation, ParkingSearch
from ..serializers import location_out

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/run", response_model=schemas.SearchResultOut)
def run_demo(db: Session = Depends(get_db)):
    manifest_path = DEMO_DIR / "demo_manifest.json"
    if not manifest_path.exists():
        raise HTTPException(500, "Demo dataset not seeded yet — run app.seed.generate_dataset")
    manifest = json.loads(manifest_path.read_text())

    saved_loc = db.get(ParkingLocation, manifest["saved_location_id"])
    if not saved_loc:
        raise HTTPException(500, "Demo target location missing from database — reseed the dataset")

    t0 = time.time()
    current_bytes = (DEMO_DIR / "demo_current.jpg").read_bytes()
    query_embedding = embedding.create_embedding(current_bytes)

    # This query photo is one of our own generated images, so its true source is known.
    # We use that source location's own confidently-labeled landmarks as the "detected"
    # landmarks here, standing in for what a real vision-model read would return — the
    # documented AI fallback behavior (predefined dataset) for the one-click demo path.
    query_landmarks = saved_loc.landmarks

    all_locations = db.query(ParkingLocation).all()
    ranked = search.rank_candidates(query_embedding, [(loc, loc.embedding) for loc in all_locations])

    scored = []
    for loc, visual_sim in ranked:
        matched, ratio = search.landmark_match(query_landmarks, loc.landmarks)
        scored.append((loc, search.combined_score(visual_sim, ratio), matched))
    scored.sort(key=lambda item: -item[1])
    top5 = scored[:5]

    best_loc, best_score, best_matched = top5[0]
    elapsed_ms = int((time.time() - t0) * 1000)

    search_row = ParkingSearch(
        saved_location_id=saved_loc.id,
        query_image_url="/static/demo/demo_current.jpg",
        matched_location_id=best_loc.id,
        similarity_score=best_score,
        candidates=[{"location_id": loc.id, "similarity": s} for loc, s, _ in top5],
    )
    db.add(search_row)
    db.commit()

    return schemas.SearchResultOut(
        search_id=search_row.id,
        query_image_url=search_row.query_image_url,
        candidates=[schemas.CandidateOut(location=location_out(loc), similarity=s) for loc, s, _ in top5],
        best_match=schemas.CandidateOut(location=location_out(best_loc), similarity=best_score),
        matched_landmarks=best_matched,
        locations_analyzed=len(all_locations),
        search_time_ms=elapsed_ms,
    )
