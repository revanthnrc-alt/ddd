"""Attack scenario generators for relay attacks."""
from typing import Tuple, List, Optional
from datetime import datetime
import uuid
import random
from backen.schemas import ScenarioModel, EventModel


def _mk_id(prefix: str):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def generate_relay_attack(zone_center: Tuple[float, float] = (31.62, 74.87), drop_delay_seconds: int = 45, pickup_delay_seconds: int = 180, noise_m: float = 0.0002) -> ScenarioModel:
    lat, lon = zone_center
    drone = _mk_id("DRONE")
    person = _mk_id("PERSON")
    pkg = _mk_id("PKG")

    seq = [
        EventModel(entity_id=drone, entity_type="drone", action="enter", timestamp_offset_seconds=0, coords=[lat + 0.0001 + random.uniform(-noise_m, noise_m), lon + 0.0001 + random.uniform(-noise_m, noise_m)]),
        EventModel(entity_id=drone, entity_type="drone", action="drop", timestamp_offset_seconds=drop_delay_seconds, coords=[lat + 0.00012 + random.uniform(-noise_m, noise_m), lon + 0.00009 + random.uniform(-noise_m, noise_m)], metadata={"package_id": pkg}),
        EventModel(entity_id=drone, entity_type="drone", action="leave", timestamp_offset_seconds=drop_delay_seconds + 1, coords=[lat + 0.0005 + random.uniform(-noise_m, noise_m), lon + 0.0005 + random.uniform(-noise_m, noise_m)]),
        EventModel(entity_id=person, entity_type="person", action="enter", timestamp_offset_seconds=pickup_delay_seconds, coords=[lat + 0.00015 + random.uniform(-noise_m, noise_m), lon + 0.00011 + random.uniform(-noise_m, noise_m)]),
        EventModel(entity_id=person, entity_type="person", action="pickup", timestamp_offset_seconds=pickup_delay_seconds + 50, coords=[lat + 0.00013 + random.uniform(-noise_m, noise_m), lon + 0.0001 + random.uniform(-noise_m, noise_m)], metadata={"package_id": pkg}),
        EventModel(entity_id=person, entity_type="person", action="leave", timestamp_offset_seconds=pickup_delay_seconds + 101, coords=[lat + 0.0006 + random.uniform(-noise_m, noise_m), lon + 0.0006 + random.uniform(-noise_m, noise_m)]),
    ]
    return ScenarioModel(scenario_id=_mk_id("SCN"), description="relay attack generated", event_sequence=seq)


def generate_variants(n: int = 3):
    return [generate_relay_attack() for _ in range(n)]
