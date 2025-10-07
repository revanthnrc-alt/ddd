"""AI Engine routes that integrate with Gemini to generate red-team scenarios and blue-team patches."""
from fastapi import APIRouter, Body
from typing import Optional, Any, Dict
from services.gemini_client import call_gemini
from schemas import GeminiResponse, ScenarioModel, PatchModel, RunResultModel, RuleModel
from utils.attack_scenarios import generate_relay_attack
import json
import logging
import uuid

router = APIRouter()
logger = logging.getLogger("ai_engine")


RED_TEAM_PROMPT = """
You are Red Team. Given the defensive rule below, craft a relay attack scenario in JSON.

Defensive rule: {rule}

Return a JSON object with keys: scenario_id, description, event_sequence (list of events with entity_id, entity_type, action, timestamp_offset_seconds, coords [lat,lon], metadata optional).

Be concise and ensure timestamps are offsets in seconds from 0.
"""


BLUE_TEAM_PROMPT = """
You are Blue Team. Given the attack log and the current detection rule, propose a patch in JSON that includes 'rule_id', 'trigger_conditions', 'temporal_window_seconds', 'coords_radius_meters', and 'required_event_sequence'. Also include a short textual justification.

Return JSON with keys: patch_json, justification
"""


@router.post("/red_team")
async def red_team(rule_text: Optional[str] = Body(None), rule_json: Optional[dict] = Body(None)) -> Dict[str, Any]:
    """Generate a red-team scenario using Gemini. Falls back to a local generator if no API key or Gemini fails.

    Request examples:
      { "rule_text": "loiter_v1..." }

    Response: scenario JSON
    """
    prompt = RED_TEAM_PROMPT.format(rule=rule_text or json.dumps(rule_json or {}))
    ai_resp = await call_gemini(prompt)
    # best-effort parse
    if not ai_resp.get("success"):
        # fallback to local generator
        scenario = generate_relay_attack()
        return {"scenario_id": scenario.scenario_id, "event_sequence": [e.dict() for e in scenario.event_sequence], "description": scenario.description, "raw_ai_output": ai_resp}

    content = ai_resp.get("content")
    if isinstance(content, dict):
        return content
    # try parse text as JSON
    try:
        parsed = json.loads(content)
        return parsed
    except Exception:
        # fallback
        scenario = generate_relay_attack()
        return {"scenario_id": scenario.scenario_id, "event_sequence": [e.dict() for e in scenario.event_sequence], "description": scenario.description, "raw_ai_output": content}


@router.post("/blue_team")
async def blue_team(attack_log: dict = Body(...), current_rule: dict = Body(...)) -> Dict[str, Any]:
    """Ask Gemini for a patch given an attack log and current rule.

    Returns: { patch_json, justification, raw_ai_output }
    """
    prompt = BLUE_TEAM_PROMPT
    prompt = prompt + "\nCurrent rule: " + json.dumps(current_rule) + "\nAttack log: " + json.dumps(attack_log)
    ai_resp = await call_gemini(prompt)
    if not ai_resp.get("success"):
        return {"patch_json": None, "justification": "AI unavailable, fallback required", "raw_ai_output": ai_resp}
    content = ai_resp.get("content")
    if isinstance(content, dict):
        return content
    # try parse
    try:
        parsed = json.loads(content)
        return parsed
    except Exception:
        return {"patch_json": None, "justification": "Could not parse AI output", "raw_ai_output": content}
