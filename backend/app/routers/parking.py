import io
import re
import time
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from .. import schemas
from ..ai import embedding, search, vision
from ..config import IMAGES_DIR, ROWS
from ..database import get_db
from ..models import ParkingLandmark, ParkingLocation, ParkingSearch
from ..serializers import location_out

router = APIRouter(prefix="/api/parking", tags=["parking"])

RECOGNITION_THRESHOLD = 0.75  # visual similarity needed to adopt an existing slot's identity


def _normalize_to_jpeg(image_bytes: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Uploaded file is not a valid image")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def _parse_row(parking_number: str) -> int:
    match = re.search(r"(\d+)$", parking_number)
    return int(match.group(1)) if match else 1


def _next_free_slot(db: Session, floor: str, zone: str) -> int:
    used = {loc.row for loc in db.query(ParkingLocation).filter_by(floor=floor, zone=zone).all()}
    for row in ROWS:
        if row not in used:
            return row
    return max(ROWS) + len(used) - len(ROWS) + 1


@router.post("/save", response_model=schemas.SaveResultOut)
async def save_parking(file: UploadFile = File(...), db: Session = Depends(get_db)):
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(400, "Empty file")
    image_bytes = _normalize_to_jpeg(raw_bytes)

    vres = vision.analyze_image(image_bytes)
    query_embedding = embedding.create_embedding(image_bytes)

    floor, zone, parking_number, confidence = vres.floor, vres.zone, vres.parking_number, vres.confidence
    recognized_location: ParkingLocation | None = None

    if floor and zone and parking_number:
        row = _parse_row(parking_number)
    else:
        existing = db.query(ParkingLocation).all()
        ranked = search.rank_candidates(query_embedding, [(loc, loc.embedding) for loc in existing]) if existing else []
        if ranked and ranked[0][1] >= RECOGNITION_THRESHOLD:
            best_loc, best_sim = ranked[0]
            floor, zone, parking_number, row = best_loc.floor, best_loc.zone, best_loc.parking_number, best_loc.row
            confidence = best_sim
            recognized_location = best_loc
        else:
            floor = floor or "P1"
            zone = zone or "A"
            row = _next_free_slot(db, floor, zone)
            parking_number = f"{zone}{row:02d}"
            confidence = max(confidence, 0.5)

    filename = f"save_{uuid.uuid4().hex[:10]}.jpg"
    (IMAGES_DIR / filename).write_bytes(image_bytes)

    if recognized_location is not None:
        # Re-saving a spot the corpus already knows (recognized purely by visual
        # similarity) updates that same location rather than cloning a second row
        # under the same floor/zone/number — a photo of C05 saved twice is one spot.
        location = recognized_location
        location.image_url = f"/static/images/{filename}"
        location.landmarks = vres.landmarks
        location.embedding = query_embedding
        db.query(ParkingLandmark).filter_by(parking_location_id=location.id).delete()
    else:
        location = ParkingLocation(
            floor=floor,
            zone=zone,
            row=row,
            parking_number=parking_number,
            image_url=f"/static/images/{filename}",
            landmarks=vres.landmarks,
            embedding=query_embedding,
            is_demo=False,
        )
        db.add(location)
        db.flush()

    for lm in vres.landmarks:
        db.add(
            ParkingLandmark(
                parking_location_id=location.id,
                type=lm["type"],
                value=lm["value"],
                confidence=lm.get("confidence", 0.8),
            )
        )
    db.commit()

    return schemas.SaveResultOut(
        location=location_out(location),
        confidence=confidence,
        detected_landmarks=[{**lm, "matched": True} for lm in vres.landmarks],
    )


@router.post("/search", response_model=schemas.SearchResultOut)
async def search_parking(file: UploadFile = File(...), db: Session = Depends(get_db)):
    t0 = time.time()
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(400, "Empty file")
    image_bytes = _normalize_to_jpeg(raw_bytes)

    all_locations = db.query(ParkingLocation).all()
    if not all_locations:
        raise HTTPException(404, "No parking locations saved yet")

    vres = vision.analyze_image(image_bytes)
    query_embedding = embedding.create_embedding(image_bytes)

    ranked = search.rank_candidates(query_embedding, [(loc, loc.embedding) for loc in all_locations])
    # At this corpus size, re-rank every candidate rather than a top-K shortlist —
    # visual similarity alone is compressed enough that the eventual best combined
    # match isn't always in a small visual-only shortlist. A larger corpus would want
    # a pgvector ANN shortlist here before this landmark re-rank; 48 locations don't.
    scored = []
    for loc, visual_sim in ranked:
        matched, ratio = search.landmark_match(vres.landmarks, loc.landmarks)
        scored.append((loc, search.combined_score(visual_sim, ratio), matched))
    scored.sort(key=lambda item: -item[1])
    top5 = scored[:5]

    best_loc, best_score, best_matched = top5[0]

    filename = f"query_{uuid.uuid4().hex[:10]}.jpg"
    (IMAGES_DIR / filename).write_bytes(image_bytes)

    search_row = ParkingSearch(
        query_image_url=f"/static/images/{filename}",
        matched_location_id=best_loc.id,
        similarity_score=best_score,
        candidates=[{"location_id": loc.id, "similarity": s} for loc, s, _ in top5],
    )
    db.add(search_row)
    db.commit()

    elapsed_ms = int((time.time() - t0) * 1000)

    return schemas.SearchResultOut(
        search_id=search_row.id,
        query_image_url=search_row.query_image_url,
        candidates=[schemas.CandidateOut(location=location_out(loc), similarity=s) for loc, s, _ in top5],
        best_match=schemas.CandidateOut(location=location_out(best_loc), similarity=best_score),
        matched_landmarks=best_matched,
        locations_analyzed=len(all_locations),
        search_time_ms=elapsed_ms,
    )


@router.get("", response_model=list[schemas.ParkingLocationOut])
def list_parking(db: Session = Depends(get_db)):
    locations = db.query(ParkingLocation).order_by(
        ParkingLocation.floor, ParkingLocation.zone, ParkingLocation.row
    ).all()
    return [location_out(loc) for loc in locations]


@router.get("/{location_id}", response_model=schemas.ParkingLocationOut)
def get_parking(location_id: str, db: Session = Depends(get_db)):
    loc = db.get(ParkingLocation, location_id)
    if not loc:
        raise HTTPException(404, "Parking location not found")
    return location_out(loc)
