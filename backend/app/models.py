import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ParkingLocation(Base):
    """A single parking spot. `embedding` is a plain float list today; swapping the
    column to pgvector's `vector` type and DATABASE_URL to Postgres is the whole
    migration — search.py's interface does not change."""

    __tablename__ = "parking_locations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    floor: Mapped[str] = mapped_column(String, index=True)
    zone: Mapped[str] = mapped_column(String, index=True)
    row: Mapped[int] = mapped_column(Integer)
    parking_number: Mapped[str] = mapped_column(String, index=True)
    image_url: Mapped[str] = mapped_column(String)
    landmarks: Mapped[list] = mapped_column(JSON, default=list)
    embedding: Mapped[list] = mapped_column(JSON, default=list)
    is_demo: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    landmark_rows: Mapped[list["ParkingLandmark"]] = relationship(
        back_populates="parking_location", cascade="all, delete-orphan"
    )


class ParkingSearch(Base):
    __tablename__ = "parking_searches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    saved_location_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("parking_locations.id"), nullable=True
    )
    query_image_url: Mapped[str] = mapped_column(String)
    matched_location_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("parking_locations.id"), nullable=True
    )
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0)
    candidates: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ParkingLandmark(Base):
    __tablename__ = "parking_landmarks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    parking_location_id: Mapped[str] = mapped_column(
        String, ForeignKey("parking_locations.id")
    )
    type: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    parking_location: Mapped["ParkingLocation"] = relationship(back_populates="landmark_rows")
