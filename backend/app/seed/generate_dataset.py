"""Seeds the demo dataset: 48 parking locations with rendered images, ground-truth
landmarks, and computed embeddings; plus the fixed TRY DEMO scenario and a held-out
set of AI-performance test images.

Run with: python -m app.seed.generate_dataset
"""

import json
import random

from sqlalchemy.orm import Session

from ..ai.embedding import create_embedding
from ..config import DEMO_DIR, FLOORS, IMAGES_DIR, ROWS, ZONES
from ..database import Base, SessionLocal, engine
from ..models import ParkingLandmark, ParkingLocation
from .scene_renderer import SpotFeatures, image_to_bytes, render_scene, spot_features

DEMO_TARGET = ("P1", "B", 3)  # matches the running example in the product spec
TEST_SET_SIZE = 20
TEST_SET_SEED = 42


def landmarks_for(feats: SpotFeatures) -> list[dict]:
    landmarks = [
        {"type": "sign", "value": f"{feats.parking_number} sign", "confidence": 0.97},
        {"type": "column", "value": f"{feats.zone_color_name} column", "confidence": 0.95},
        {"type": "wall_pattern", "value": "Wall pattern", "confidence": 0.85},
        {"type": "floor_marking", "value": "Parking markings", "confidence": 0.8},
    ]
    if feats.has_elevator:
        landmarks.append({"type": "elevator", "value": "Elevator", "confidence": 0.9})
    if feats.has_fire_cabinet:
        landmarks.append({"type": "fire_cabinet", "value": "Fire cabinet", "confidence": 0.9})
    return landmarks


def _all_spots() -> list[tuple[str, str, int]]:
    return [(floor, zone, row) for floor in FLOORS for zone in ZONES for row in ROWS]


def seed(db: Session) -> None:
    db.query(ParkingLandmark).delete()
    db.query(ParkingLocation).delete()
    db.commit()

    all_spots = _all_spots()
    test_spots = set(random.Random(TEST_SET_SEED).sample(all_spots, TEST_SET_SIZE))

    demo_manifest: dict = {}
    test_cases: list[dict] = []

    for floor, zone, row in all_spots:
        feats = spot_features(floor, zone, row)
        landmarks = landmarks_for(feats)

        saved_bytes = image_to_bytes(render_scene(floor, zone, row, with_car=True, variant="saved"))
        filename = f"{floor}_{feats.parking_number}.jpg"
        (IMAGES_DIR / filename).write_bytes(saved_bytes)

        embedding = create_embedding(saved_bytes)

        location = ParkingLocation(
            floor=floor,
            zone=zone,
            row=row,
            parking_number=feats.parking_number,
            image_url=f"/static/images/{filename}",
            landmarks=landmarks,
            embedding=embedding,
            is_demo=True,
        )
        db.add(location)
        db.flush()  # assign location.id before writing dependent landmark rows

        for lm in landmarks:
            db.add(
                ParkingLandmark(
                    parking_location_id=location.id,
                    type=lm["type"],
                    value=lm["value"],
                    confidence=lm["confidence"],
                )
            )

        if (floor, zone, row) == DEMO_TARGET:
            current_bytes = image_to_bytes(render_scene(floor, zone, row, with_car=False, variant="demo-current"))
            current_filename = "demo_current.jpg"
            (DEMO_DIR / current_filename).write_bytes(current_bytes)
            demo_manifest = {
                "saved_location_id": location.id,
                "parking_number": feats.parking_number,
                "floor": floor,
                "current_image_url": f"/static/demo/{current_filename}",
            }

        if (floor, zone, row) in test_spots:
            test_bytes = image_to_bytes(
                render_scene(floor, zone, row, with_car=False, variant=f"test-{feats.parking_number}-{floor}")
            )
            test_filename = f"test_{floor}_{feats.parking_number}.jpg"
            (DEMO_DIR / test_filename).write_bytes(test_bytes)
            test_cases.append(
                {
                    "test_id": f"TEST-{len(test_cases) + 1:02d}",
                    "expected_location_id": location.id,
                    "expected_label": f"{floor}/{feats.parking_number}",
                    "image_url": f"/static/demo/{test_filename}",
                }
            )

    db.commit()

    (DEMO_DIR / "demo_manifest.json").write_text(json.dumps(demo_manifest, indent=2))
    (DEMO_DIR / "test_manifest.json").write_text(json.dumps(test_cases, indent=2))

    print(f"Seeded {db.query(ParkingLocation).count()} parking locations")
    print(f"Demo scenario target: {demo_manifest}")
    print(f"AI-performance test cases: {len(test_cases)}")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
