import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
IMAGES_DIR = STATIC_DIR / "images"
DEMO_DIR = STATIC_DIR / "demo"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DEMO_DIR.mkdir(parents=True, exist_ok=True)

# Architected for a straight swap to Postgres: DATABASE_URL="postgresql://..." + pgvector column.
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'parkai.db'}")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com").strip()
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_VISION_MODEL", "claude-sonnet-5")

# Real vision calls only fire when a usable key is present; otherwise the deterministic
# fallback pipeline runs so the demo never breaks mid-presentation (see ai/vision.py).
AI_VISION_ENABLED = bool(ANTHROPIC_API_KEY)

FLOORS = ["P1", "P2"]
ZONES = ["A", "B", "C", "D"]
ROWS = list(range(1, 7))  # 01..06 per zone -> 2 floors * 4 zones * 6 rows = 48 locations
