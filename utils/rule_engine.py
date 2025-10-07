"""Rule evaluation engine for scenarios."""
from typing import Optional, Dict, Any, List
from schemas import ScenarioModel, RuleModel, RunResultModel, AlertModel
from math import radians, cos, sin, asin, sqrt
from datetime import datetime, timedelta
import uuid


def _haversine_meters(a: List[float], b: List[float]) -> float:
    # haversine formula
    lat1, lon1 = a
    lat2, lon2 = b
    # convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    hav = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(hav))
    R = 6371000
    return R * c


def evaluate_scenario(scenario: ScenarioModel, rule: Optional[RuleModel] = None, zone_def: Optional[Dict[str, Any]] = None) -> RunResultModel:
    """Evaluate a scenario against a rule.

    Supports:
      - loiter rule (single entity stays > loiter_time_seconds in zone)
      - stateful handoff patch with trigger 'drop' and 'pickup' within time and proximity

    Returns a RunResultModel summary.
    """
    # default rule if none
    if rule is None:
        rule = RuleModel(rule_id="loiter_v1", rule_json={"type": "loiter", "loiter_time_seconds": 60, "zone": "Z"}, description="Default loiter rule")

    alerts = []
    event_count = len(scenario.event_sequence)
    bypassed = 0
    detected = False

    # Convert event offsets to timestamps (relative)
    base_ts = datetime.utcnow()
    events = []
    for ev in scenario.event_sequence:
        ts = base_ts + timedelta(seconds=ev.timestamp_offset_seconds)
        events.append({"entity_id": ev.entity_id, "action": ev.action, "coords": ev.coords, "timestamp": ts, "metadata": ev.metadata or {}})

    # Loiter detection: measure time between first enter and last leave per entity
    # Build per-entity timeline
    entity_times = {}
    for e in events:
        ent = e["entity_id"]
        if ent not in entity_times:
            entity_times[ent] = {"first_seen": e["timestamp"], "last_seen": e["timestamp"]}
        else:
            entity_times[ent]["last_seen"] = e["timestamp"]

    if rule.rule_json.get("type") == "loiter":
        threshold = int(rule.rule_json.get("loiter_time_seconds", 60))
        for ent, times in entity_times.items():
            duration = (times["last_seen"] - times["first_seen"]).total_seconds()
            if duration > threshold:
                detected = True
                alerts.append(AlertModel(alert_id=str(uuid.uuid4()), level="high", evidence=[{"entity_id": ent, "duration": duration}]))

    # Stateful handoff detection when patch is applied
    if rule.rule_json.get("rule_id") == "stateful_handoff_v2" or rule.rule_json.get("required_event_sequence"):
        # extract parameters
        temporal_window = int(rule.rule_json.get("temporal_window_seconds", 600))
        radius_m = float(rule.rule_json.get("coords_radius_meters", 10))
        # find drop events
        pending = []
        for idx, e in enumerate(events):
            if e["action"] == "drop":
                pending.append({"drop_ts": e["timestamp"], "coords": e["coords"], "metadata": e.get("metadata", {})})
            if e["action"] == "pickup":
                # find matching pending within window and proximity
                matched = None
                for p in pending:
                    if (e["timestamp"] - p["drop_ts"]).total_seconds() <= temporal_window:
                        dist = _haversine_meters(e["coords"], p["coords"])
                        if dist <= radius_m:
                            matched = p
                            break
                if matched:
                    detected = True
                    alerts.append(AlertModel(alert_id=str(uuid.uuid4()), level="critical", evidence=[{"drop": matched, "pickup": e}]))
                    pending.remove(matched)

    result = RunResultModel(detected=detected, alerts=alerts, bypassed_events_count=bypassed, event_count=event_count, scenario=scenario)
    return result
