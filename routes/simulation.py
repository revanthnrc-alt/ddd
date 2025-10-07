"""Simulation routes: run simulations, apply patches, retrieve logs."""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List, Any
from database import get_db, create_tables
from sqlalchemy.orm import Session
from services.gemini_client import call_gemini
from utils.attack_scenarios import generate_relay_attack
from utils.rule_engine import evaluate_scenario
from models import Rule, SimulationRun, EventLog, Patch
from schemas import ScenarioModel, RunResultModel, RuleModel, PatchModel
import uuid
import logging

router = APIRouter()
logger = logging.getLogger("simulation_routes")


@router.post("/run", response_model=RunResultModel)
async def run_simulation(scenario: Optional[Any] = Body(None), db: Session = Depends(get_db)):
    """Run a simulation against the active rule.

    If scenario is omitted, a generated relay attack will be used.

    Sample request: {}
    Sample response: RunResultModel
    """
    # Ensure tables
    create_tables()

    # Accept either omitted body or an empty object as 'generate a scenario'
    if not scenario:
        scenario = generate_relay_attack()
    else:
        # If the client sent a dict, try to coerce into ScenarioModel
        if not isinstance(scenario, ScenarioModel):
            try:
                scenario = ScenarioModel.parse_obj(scenario)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid scenario payload: {e}")

    # load active rule
    active_rule = db.query(Rule).filter(Rule.active == True).first()
    if active_rule:
        rule_model = RuleModel(rule_id=active_rule.rule_id, rule_json=active_rule.rule_json, description=active_rule.description, active=active_rule.active)
    else:
        rule_model = None

    result = evaluate_scenario(scenario, rule_model)

    # persist run
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    sim = SimulationRun(run_id=run_id, rule_id=rule_model.rule_id if rule_model else None, result_summary=result.dict())
    db.add(sim)
    db.commit()

    # persist events
    for idx, ev in enumerate(scenario.event_sequence):
        log = EventLog(scenario_id=scenario.scenario_id, event_index=idx, entity_id=ev.entity_id, entity_type=ev.entity_type, action=ev.action, coords=ev.coords, meta=ev.metadata or {}, result=None)
        db.add(log)
    db.commit()

    return result


@router.post("/apply_patch", response_model=RuleModel)
async def apply_patch(patch: PatchModel, db: Session = Depends(get_db)):
    """Apply a patch (blue team) - persists patch and activates the corresponding rule.

    Request: PatchModel
    Response: activated RuleModel
    """
    create_tables()
    patch_id = patch.patch_id or f"patch_{uuid.uuid4().hex[:8]}"
    # create patch
    p = Patch(patch_id=patch_id, patch_json=patch.patch_json or {}, description=patch.description)
    db.add(p)

    # create/activate new rule
    rule_id = patch.patch_json.get("rule_id") if patch.patch_json else f"rule_{uuid.uuid4().hex[:8]}"
    # deactivate other rules
    db.query(Rule).update({Rule.active: False})
    new_rule = Rule(rule_id=rule_id, rule_json=patch.patch_json or {}, description=patch.description or "Applied patch", active=True)
    db.add(new_rule)
    db.commit()
    return RuleModel(rule_id=new_rule.rule_id, rule_json=new_rule.rule_json, description=new_rule.description, active=new_rule.active)


@router.get("/logs")
async def get_logs(limit: int = Query(20, ge=1, le=200), offset: int = 0, db: Session = Depends(get_db)):
    """Return past simulation runs with pagination."""
    create_tables()
    runs = db.query(SimulationRun).order_by(SimulationRun.created_at.desc()).limit(limit).offset(offset).all()
    return {"runs": [r.result_summary for r in runs], "count": len(runs)}
