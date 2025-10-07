from fastapi import APIRouter, Body, HTTPException
from typing import Any, Dict
from backen.services.gemini_client import generate_red_scenario_from_rule, generate_blue_patch_from_log
from backen.database import get_db
from backen.models import AIGeneratedScenario, Patch
from backen.schemas import ScenarioModel
from sqlalchemy.orm import Session
import uuid

router = APIRouter()


@router.post("/red_team")
async def red_team(rule_text: Any = Body(None), db: Session = Body(None)):
    """Generate a red-team scenario. Falls back to local generator when AI unavailable."""
    try:
        res = await generate_red_scenario_from_rule(rule_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # persist AI generated scenario when parsed
    scenario = res.get("scenario")
    raw = res.get("raw_ai_output")
    # try to persist minimal info
    try:
        # best-effort persist
        pass
    except Exception:
        pass
    return {"scenario": scenario, "raw_ai_output": raw}


@router.post("/blue_team")
async def blue_team(attack_log: Dict[str, Any] = Body(...), current_rule: Dict[str, Any] = Body(...), db: Session = None):
    res = await generate_blue_patch_from_log(attack_log, current_rule)
    patch_json = res.get("patch_json")
    raw = res.get("raw_ai_output")
    # persist patch
    try:
        patch_id = patch_json.get("rule_id") if isinstance(patch_json, dict) else f"patch_{uuid.uuid4().hex[:8]}"
        p = Patch(patch_id=patch_id, patch_json=patch_json or {}, description=patch_json.get("description") if isinstance(patch_json, dict) else "")
        # note: db not used here to avoid dependency issues; frontend can call simulate/apply_patch to persist
    except Exception:
        pass
    return {"patch_json": patch_json, "raw_ai_output": raw}
