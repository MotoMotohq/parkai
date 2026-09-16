"""Vision analysis step: raw photo bytes -> structured landmarks + a location guess.

Two modes, chosen automatically (see config.AI_VISION_ENABLED):
  - real mode: calls Claude's vision API to read signs and describe landmarks.
  - fallback mode: real pixel-based feature extraction (dominant color, wall tone)
    with no LLM call. Used whenever no API key is configured, or the API call
    fails for any reason — the demo must never break mid-presentation.
"""

import base64
import io
import json
import re
from dataclasses import dataclass

import httpx
import numpy as np
from PIL import Image

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL, AI_VISION_ENABLED

ZONE_COLORS = {
    "A": (215, 60, 60),
    "B": (50, 95, 205),
    "C": (215, 175, 45),
    "D": (60, 150, 95),
}
ZONE_COLOR_NAMES = {"A": "Red", "B": "Blue", "C": "Gold", "D": "Green"}

VISION_PROMPT = """You are the computer-vision component inside a parking-garage app called PARKAI.
Look at this photo of a parking spot / garage interior and reply with ONLY a JSON object
(no prose, no markdown fences) shaped exactly like this:

{
  "floor": "P1 or P2 if a floor sign is visible, else null",
  "zone": "single letter A-D if a zone sign or color-coded column is visible, else null",
  "parking_number": "the exact alphanumeric spot code painted or printed on a sign, else null",
  "landmarks": [
    {"type": "sign|column|elevator|fire_cabinet|wall_pattern|floor_marking|other", "value": "short human label", "confidence": 0.0-1.0}
  ],
  "confidence": 0.0-1.0
}

List every distinguishing landmark actually visible (columns and their color, elevators,
fire cabinets/extinguishers, signage, wall textures/colors, floor paint/markings). Be honest:
if a sign is not clearly legible, set that field to null instead of guessing.
"""


@dataclass
class VisionResult:
    landmarks: list[dict]
    floor: str | None
    zone: str | None
    parking_number: str | None
    confidence: float
    source: str  # "claude_vision" | "heuristic_cv"


def _extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text.strip(), re.DOTALL)
    if not match:
        raise ValueError("no JSON object in model output")
    return json.loads(match.group(0))


def _norm_zone(value) -> str | None:
    if not value:
        return None
    letter = str(value).strip().upper()[:1]
    return letter if letter in ZONE_COLOR_NAMES else None


def _call_claude_vision(image_bytes: bytes, media_type: str) -> VisionResult:
    b64 = base64.b64encode(image_bytes).decode("ascii")
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": VISION_PROMPT},
                ],
            }
        ],
    }
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    resp = httpx.post(f"{ANTHROPIC_BASE_URL}/v1/messages", json=payload, headers=headers, timeout=30.0)
    resp.raise_for_status()
    data = resp.json()
    text = "".join(block.get("text", "") for block in data.get("content", []) if block.get("type") == "text")
    parsed = _extract_json(text)

    landmarks = [
        {
            "type": str(lm.get("type", "other")),
            "value": str(lm.get("value", "")).strip(),
            "confidence": float(lm.get("confidence", 0.8)),
        }
        for lm in (parsed.get("landmarks") or [])
        if lm.get("value")
    ]
    return VisionResult(
        landmarks=landmarks,
        floor=(parsed.get("floor") or None),
        zone=_norm_zone(parsed.get("zone")),
        parking_number=(parsed.get("parking_number") or None),
        confidence=float(parsed.get("confidence", 0.75)),
        source="claude_vision",
    )


def _zone_by_area_vote(img: Image.Image) -> str:
    """Picks the zone color covering the most pixel area, rather than the single
    most-saturated patch — a small vivid prop (e.g. a red fire-cabinet icon) would
    otherwise outvote the much larger column even when the column is a different
    color, since a single dominant patch has no notion of area."""
    small = img.convert("RGB").resize((160, 120))
    arr = np.asarray(small, dtype=np.float32).reshape(-1, 3)
    best_zone, best_count = "A", -1
    for zone, ref in ZONE_COLORS.items():
        ref_arr = np.asarray(ref, dtype=np.float32)
        dist = np.linalg.norm(arr - ref_arr, axis=1)
        count = int(np.sum(dist < 60))
        if count > best_count:
            best_count, best_zone = count, zone
    return best_zone


def _heuristic_cv(image_bytes: bytes) -> VisionResult:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.asarray(img, dtype=np.float32)
    mean_color = tuple(float(c) for c in arr.reshape(-1, 3).mean(axis=0))
    zone_guess = _zone_by_area_vote(img)
    warmth = mean_color[0] - mean_color[2]  # R - B: warm vs cool overall cast
    floor_guess = "P1" if warmth >= 0 else "P2"
    brightness = sum(mean_color) / 3.0

    landmarks = [
        {"type": "column", "value": f"{ZONE_COLOR_NAMES[zone_guess]} column", "confidence": 0.6},
        {"type": "wall_pattern", "value": "Wall pattern", "confidence": 0.55},
        {"type": "floor_marking", "value": "Parking markings", "confidence": 0.5},
    ]
    if brightness < 90:
        landmarks.append({"type": "other", "value": "Low-light garage interior", "confidence": 0.4})

    return VisionResult(
        landmarks=landmarks,
        floor=floor_guess,
        zone=zone_guess,
        parking_number=None,
        confidence=0.5,
        source="heuristic_cv",
    )


def analyze_image(image_bytes: bytes, media_type: str = "image/jpeg") -> VisionResult:
    if AI_VISION_ENABLED:
        try:
            return _call_claude_vision(image_bytes, media_type)
        except Exception:
            pass  # network/parse failure -> silently drop to the offline heuristic
    return _heuristic_cv(image_bytes)
