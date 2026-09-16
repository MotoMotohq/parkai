from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import AI_VISION_ENABLED, STATIC_DIR
from .database import Base, SessionLocal, engine
from .models import ParkingLocation
from .routers import analytics, demo, parking
from .seed.generate_dataset import seed

Base.metadata.create_all(bind=engine)

# Render's filesystem is ephemeral — every fresh deploy/restart starts with an empty
# DB and no generated images. Re-seeding on an empty DB makes that a non-issue instead
# of a demo that silently breaks after the first redeploy.
with SessionLocal() as _db:
    if _db.query(ParkingLocation).count() == 0:
        seed(_db)

app = FastAPI(title="PARKAI API", description="Visual Parking Finder — AI vision pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(parking.router)
app.include_router(demo.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "ai_vision_enabled": AI_VISION_ENABLED}
