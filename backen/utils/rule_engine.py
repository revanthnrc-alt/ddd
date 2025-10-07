from typing import Dict, Any, List, Optional
from backen.schemas import ScenarioModel, RunResultModel
from math import radians, cos, sin, asin, sqrt
from datetime import datetime, timedelta
import uuid


def _haversine_meters(a: List[float], b: List[float]) -> float:
    lat1, lon1 = a
    lat2, lon2 = b
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    hav = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(hav))
    R = 6371000
    return R * c


def evaluate_scenario(scenario: Any, rule_json: Optional[Dict[str, Any]] = None) -> RunResultModel:
    # Accept either a ScenarioModel or a plain dict
    if rule_json is None:
        rule_json = {"type": "loiter", "loiter_time_seconds": 60, "zone": "Z"}

    events = []
    base = datetime.utcnow()

    raw_seq = []
    if hasattr(scenario, "event_sequence"):
        raw_seq = scenario.event_sequence
    elif isinstance(scenario, dict):
        raw_seq = scenario.get("event_sequence", [])
    else:
        # try to coerce
        raw_seq = []

    for ev in raw_seq:
        # ev may be a Pydantic model or a plain dict
        if hasattr(ev, "timestamp_offset_seconds"):
            offset = getattr(ev, "timestamp_offset_seconds")
        else:
            offset = ev.get("timestamp_offset_seconds") if isinstance(ev, dict) else None
        if offset is None:
            # fall back to 'timestamp' (assumed seconds offset in tests/sample data)
            offset = ev.get("timestamp") if isinstance(ev, dict) else None
        offset = int(offset) if offset is not None else 0

        ts = base + timedelta(seconds=offset)

        if hasattr(ev, "coords"):
            coords = getattr(ev, "coords")
        else:
            # support latitude/longitude fields
            if isinstance(ev, dict) and ("latitude" in ev or "longitude" in ev):
                coords = [ev.get("latitude"), ev.get("longitude")]
            else:
                coords = ev.get("coords") if isinstance(ev, dict) else None

        entity_id = getattr(ev, "entity_id") if hasattr(ev, "entity_id") else (ev.get("entity_id") if isinstance(ev, dict) else None)
        action = getattr(ev, "action") if hasattr(ev, "action") else (ev.get("action") if isinstance(ev, dict) else None)
        metadata = getattr(ev, "metadata") if hasattr(ev, "metadata") else (ev.get("metadata") if isinstance(ev, dict) else {})

        events.append({"entity_id": entity_id, "action": action, "coords": coords, "timestamp": ts, "metadata": metadata or {}})

    detected = False
    alerts = []

    # loiter detection
    if rule_json.get("type") == "loiter":
        loiter_sec = int(rule_json.get("loiter_time_seconds", 60))
        times = {}
        for e in events:
            ent = e["entity_id"]
            if ent not in times:
                times[ent] = {"first": e["timestamp"], "last": e["timestamp"]}
            else:
                times[ent]["last"] = e["timestamp"]
        for ent, t in times.items():
            dur = (t["last"] - t["first"]).total_seconds()
            if dur > loiter_sec:
                detected = True
                alerts.append({"alert_id": str(uuid.uuid4()), "rule_triggered": "loiter_v1", "evidence": [{"entity_id": ent, "duration": dur}]})

    # stateful handoff
    if rule_json.get("rule_id") == "stateful_handoff_v2" or rule_json.get("required_event_sequence"):
        temporal = int(rule_json.get("temporal_window_seconds", 600))
        radius = float(rule_json.get("coords_radius_meters", 10))
        pending = []
        for e in events:
            if e["action"] == "drop":
                pending.append({"drop_ts": e["timestamp"], "coords": e["coords"], "metadata": e.get("metadata", {})})
            if e["action"] == "pickup":
                matched = None
                for p in pending:
                    if (e["timestamp"] - p["drop_ts"]).total_seconds() <= temporal:
                        dist = _haversine_meters(e["coords"], p["coords"])
                        if dist <= radius:
                            matched = p
                            break
                if matched:
                    detected = True
                    alerts.append({"alert_id": str(uuid.uuid4()), "rule_triggered": rule_json.get("rule_id", "stateful_handoff_v2"), "evidence": [{"drop": matched, "pickup": e}]})
                    pending.remove(matched)

    run_id = uuid.uuid4().hex
    # build EventModel-compatible output (timestamp_offset_seconds, action, coords)
    out_events = []
    for i, e in enumerate(events):
        offset_sec = 0
        # attempt to recover offset from original raw_seq if present
        raw = raw_seq[i] if i < len(raw_seq) else {}
        if isinstance(raw, dict):
            offset_sec = int(raw.get("timestamp_offset_seconds", raw.get("timestamp", 0) or 0))
        out_events.append({
            "entity_id": e.get("entity_id"),
            "entity_type": raw.get("entity_type") if isinstance(raw, dict) else "unknown",
            "action": e.get("action") or "move",
            "timestamp_offset_seconds": int(offset_sec),
            "coords": e.get("coords"),
            "metadata": e.get("metadata", {}),
        })

    return RunResultModel(run_id=run_id, detected=detected, alerts=alerts, event_sequence=out_events)
