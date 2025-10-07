from backen.utils.rule_engine import evaluate_scenario


def test_loiter_detects_long_loiter():
    # create a scenario where a person stays within 10m radius for >60s
    events = []
    base = {
        "entity_id": "PERSON_A",
        "latitude": 37.0,
        "longitude": -122.0,
        "timestamp": 0,
    }
    # generate 7 samples, 15s apart -> duration 90s
    for i in range(7):
        e = base.copy()
        e["timestamp"] = i * 15
        e["latitude"] = 37.00001
        e["longitude"] = -122.00001
        events.append(e)

    scenario = {"event_sequence": events}

    rule = {
        "rule_id": "loiter_v1",
        "type": "loiter",
        "params": {"radius_m": 20, "min_duration_s": 60},
    }

    result = evaluate_scenario(scenario, rule)
    assert result.detected is True
