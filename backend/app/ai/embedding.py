"""Visual embedding for parking photos.

Pure pixel signal only — a "tiny image" grayscale thumbnail (coarse layout/shape)
blended with an RGB color histogram (column color, wall/floor tone). Deliberately
excludes landmark tags: folding a sparse, variable-length bag-of-landmarks into the
same vector made cosine similarity penalize candidates for having *more* detected
landmarks than the query (their norm grows, diluting the match) even when the query
simply never attempted to detect that landmark type. Landmark matching is instead
its own explicit, explainable step (search.landmark_match) — which also doubles as
the "matched features" UI list — combined with this vector's score afterwards.

No model training involved, this is feature extraction. `search.py` is the swap
point for pgvector; this module's output (a plain float list) is unaffected.
"""

import io

import numpy as np
from PIL import Image

TINY_SIZE = 16  # -> 256 dims, coarse grayscale layout
HIST_BINS = 8  # per channel -> 24 dims
TINY_WEIGHT = 1.0
HIST_WEIGHT = 0.6


def _tiny_image_vector(img: Image.Image) -> np.ndarray:
    small = img.convert("L").resize((TINY_SIZE, TINY_SIZE))
    arr = np.asarray(small, dtype=np.float32).flatten() / 255.0
    return arr


def _color_histogram_vector(img: Image.Image) -> np.ndarray:
    rgb = img.convert("RGB")
    arr = np.asarray(rgb, dtype=np.float32)
    pixel_count = arr.shape[0] * arr.shape[1]
    channels = []
    for c in range(3):
        hist, _ = np.histogram(arr[:, :, c], bins=HIST_BINS, range=(0, 255))
        channels.append(hist.astype(np.float32) / max(pixel_count, 1))
    return np.concatenate(channels)


def _l2_normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v


def create_embedding(image_bytes: bytes) -> list[float]:
    img = Image.open(io.BytesIO(image_bytes))
    tiny = _l2_normalize(_tiny_image_vector(img)) * TINY_WEIGHT
    hist = _l2_normalize(_color_histogram_vector(img)) * HIST_WEIGHT
    vec = _l2_normalize(np.concatenate([tiny, hist]))
    return vec.tolist()
