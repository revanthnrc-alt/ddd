from fastapi import APIRouter, Depends, Body, Query, HTTPException
from typing import Optional, Any
from backen.database import get_db, create_tables
from sqlalchemy.orm import Session
from backen.models import Rule, SimulationRun, EventLog, Patch
from backen.schemas import ScenarioModel, RunResultModel, RuleModel, PatchModel
from backen.utils.attack_scenarios import generate_relay_attack
from backen.utils.rule_engine import evaluate_scenario
import uuid

router = APIRouter()


@router.post("/run", response_model=RunResultModel)
async def run_simulation(scenario: Optional[Any] = Body(None), db: Session = Depends(get_db)):
    create_tables()
    if not scenario:
        scenario = generate_relay_attack()
    else:
        if not isinstance(scenario, ScenarioModel):
            try:
                scenario = ScenarioModel.parse_obj(scenario)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid scenario payload: {e}")

    active_rule = db.query(Rule).filter(Rule.active == True).first()
    if not active_rule:
        # seed default rule
        default = Rule(rule_id="loiter_v1", rule_json={"type": "loiter", "loiter_time_seconds": 60, "zone": "Z"}, description="Default loiter rule", active=True)
        db.add(default)
        db.commit()
        active_rule = default

    result = evaluate_scenario(scenario, active_rule.rule_json)

    run_id = f"run_{uuid.uuid4().hex[:8]}"
    sim = SimulationRun(run_id=run_id, rule_id=active_rule.rule_id, result_summary=result.dict())
    db.add(sim)
    db.commit()

    for idx, ev in enumerate(scenario.event_sequence):
        log = EventLog(run_id=run_id, event_index=idx, entity_id=ev.entity_id, entity_type=ev.entity_type, action=ev.action, coords=ev.coords, meta=ev.metadata or {}, result=None)
        db.add(log)
    db.commit()

    out = result
    out.run_id = run_id
    return out


@router.post("/apply_patch", response_model=RuleModel)
async def apply_patch(patch: PatchModel, db: Session = Depends(get_db)):
    create_tables()
    patch_id = patch.patch_id or f"patch_{uuid.uuid4().hex[:8]}"
    p = Patch(patch_id=patch_id, patch_json=patch.patch_json or {}, description=patch.description)
    db.add(p)
    db.query(Rule).update({Rule.active: False})
    rule_id = patch.patch_json.get("rule_id") if patch.patch_json else f"rule_{uuid.uuid4().hex[:8]}"
    new_rule = Rule(rule_id=rule_id, rule_json=patch.patch_json or {}, description=patch.description or "Applied patch", active=True)
    db.add(new_rule)
    db.commit()
    return RuleModel(rule_id=new_rule.rule_id, rule_json=new_rule.rule_json, description=new_rule.description, active=new_rule.active)


@router.get("/logs")
async def get_logs(limit: int = Query(20, ge=1, le=200), offset: int = 0, db: Session = Depends(get_db)):
    create_tables()
    runs = db.query(SimulationRun).order_by(SimulationRun.created_at.desc()).limit(limit).offset(offset).all()
    return {"runs": [r.result_summary for r in runs], "count": len(runs)}


@router.get("/rule")
async def get_active_rule(db: Session = Depends(get_db)):
    create_tables()
    rule = db.query(Rule).filter(Rule.active == True).first()
    if not rule:
        return {"rule": None}
    return {"rule": {"rule_id": rule.rule_id, "rule_json": rule.rule_json, "description": rule.description, "active": rule.active}}
