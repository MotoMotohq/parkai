"""Cosine-similarity vector search.

Deliberately a linear scan in Python/numpy so the MVP has zero infra dependencies.
The swap to pgvector is: store `embedding` as a `vector` column and replace
`rank_candidates`'s body with `ORDER BY embedding <=> :query LIMIT :k` — callers
(routers) don't change, since they only depend on this function's signature.
"""

import numpy as np


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    va, vb = np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)
    if va.shape != vb.shape:
        return 0.0
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    sim = float(np.dot(va, vb) / denom)
    return max(0.0, min(1.0, sim))


def rank_candidates(query_embedding: list[float], candidates: list[tuple]) -> list[tuple]:
    """candidates: list of (location, embedding) pairs. Returns them sorted by
    similarity to query_embedding, descending."""
    scored = [(loc, cosine_similarity(query_embedding, emb)) for loc, emb in candidates]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored


def _landmark_key(lm: dict) -> tuple[str, str]:
    return (str(lm.get("type", "")).lower(), str(lm.get("value", "")).strip().lower())


def landmark_match(query_landmarks: list[dict], candidate_landmarks: list[dict]) -> tuple[list[dict], float]:
    """Explicit, explainable comparison of two structured landmark lists — powers
    both the score's landmark bonus and the 'matched features' UI checklist from the
    exact same computation, so the score never disagrees with what's shown on screen.
    Ratio is expressed against the candidate's own landmark count ("N/6 matched")."""
    query_keys = {_landmark_key(lm) for lm in query_landmarks}
    matched = [{**lm, "matched": _landmark_key(lm) in query_keys} for lm in candidate_landmarks]
    matched_count = sum(1 for lm in matched if lm["matched"])
    ratio = matched_count / len(candidate_landmarks) if candidate_landmarks else 0.0
    return matched, ratio


VISUAL_WEIGHT = 0.7
LANDMARK_WEIGHT = 0.3


def combined_score(visual_similarity: float, landmark_ratio: float) -> float:
    score = VISUAL_WEIGHT * visual_similarity + LANDMARK_WEIGHT * landmark_ratio
    return max(0.0, min(1.0, score))
