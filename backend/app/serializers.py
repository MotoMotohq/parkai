from .models import ParkingLocation


def location_out(loc: ParkingLocation) -> dict:
    return {
        "id": loc.id,
        "floor": loc.floor,
        "zone": loc.zone,
        "row": loc.row,
        "parking_number": loc.parking_number,
        "image_url": loc.image_url,
        "landmarks": [{**lm, "matched": True} for lm in loc.landmarks],
        "is_demo": loc.is_demo,
        "created_at": loc.created_at,
    }
