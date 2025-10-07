"""Generate relay attack scenarios for testing."""
from typing import Tuple, List, Optional
from datetime import datetime
import uuid
from schemas import ScenarioModel, EventModel
import random


def _mk_id(prefix: str):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def generate_relay_attack(zone_center: Tuple[float, float] = (37.7749, -122.4194), offsets: Optional[dict] = None) -> ScenarioModel:
    """Generate a relay attack scenario.

    Parameters:
        zone_center: tuple (lat, lon)
        offsets: optional dict to vary timing or coords

    Returns:
        ScenarioModel with event_sequence
    """
    lat, lon = zone_center
    now = int(datetime.utcnow().timestamp())
    drone_id = _mk_id("DRONE")
    person_id = _mk_id("PERSON")
    pkg_id = _mk_id("PKG")

    # base offsets
    t0 = 0
    drop_t = 45 + (offsets.get("drop_extra", 0) if offsets else 0)
    person_enter_t = 180 + (offsets.get("person_enter_extra", 0) if offsets else 0)
    pickup_t = 230 + (offsets.get("pickup_extra", 0) if offsets else 0)
    leave_t = 281 + (offsets.get("leave_extra", 0) if offsets else 0)

    seq = [
        EventModel(entity_id=drone_id, entity_type="drone", action="enter", timestamp_offset_seconds=t0, coords=[lat + 0.0001, lon + 0.0001]),
        EventModel(entity_id=drone_id, entity_type="drone", action="drop", timestamp_offset_seconds=drop_t, coords=[lat + 0.00012, lon + 0.00009], metadata={"package_id": pkg_id}),
        EventModel(entity_id=drone_id, entity_type="drone", action="leave", timestamp_offset_seconds=drop_t + 1, coords=[lat + 0.0005, lon + 0.0005]),
        EventModel(entity_id=person_id, entity_type="person", action="enter", timestamp_offset_seconds=person_enter_t, coords=[lat + 0.00015, lon + 0.00011]),
        EventModel(entity_id=person_id, entity_type="person", action="pickup", timestamp_offset_seconds=pickup_t, coords=[lat + 0.00013, lon + 0.0001], metadata={"package_id": pkg_id}),
        EventModel(entity_id=person_id, entity_type="person", action="leave", timestamp_offset_seconds=leave_t, coords=[lat + 0.0006, lon + 0.0006]),
    ]

    scenario = ScenarioModel(scenario_id=_mk_id("SCN"), description="Generated relay attack", zone={"center": [lat, lon], "radius_m": 50}, event_sequence=seq)
    return scenario
