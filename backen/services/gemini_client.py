"""Gemini client wrapper with fallbacks to local generators."""
import os
import json
import asyncio
from typing import Any, Dict
import httpx
from dotenv import load_dotenv
from backen.utils.attack_scenarios import generate_relay_attack

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_ENDPOINT = os.getenv("GEMINI_ENDPOINT")


async def call_gemini(prompt: str, max_tokens: int = 512) -> Dict[str, Any]:
    if not GOOGLE_API_KEY or not GEMINI_ENDPOINT:
        return {"error": "no_key_or_endpoint", "raw": f"Missing GOOGLE_API_KEY or GEMINI_ENDPOINT: use fallback"}

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {GOOGLE_API_KEY}"}
    payload = {"prompt": prompt, "max_tokens": max_tokens}
    retries = 2
    backoff = 0.5
    async with httpx.AsyncClient(timeout=15.0) as client:
        for attempt in range(retries + 1):
            try:
                r = await client.post(GEMINI_ENDPOINT, json=payload, headers=headers)
                text = r.text
                try:
                    parsed = r.json()
                    return {"parsed": parsed, "raw": text}
                except Exception:
                    return {"parsed": None, "raw": text}
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                if attempt < retries:
                    await asyncio.sleep(backoff * (attempt + 1))
                    continue
                return {"error": str(e)}


async def generate_red_scenario_from_rule(rule_text_or_json: Any) -> Dict[str, Any]:
    prompt = f"You are an adversarial generator. The detection rule is: {json.dumps(rule_text_or_json)}. Output ONLY JSON with keys: scenario_id, description, event_sequence (each event: entity_id, entity_type, action, timestamp_offset_seconds, coords, metadata)."
    resp = await call_gemini(prompt)
    if resp.get("error"):
        return {"scenario": generate_relay_attack().dict(), "raw_ai_output": resp}
    if resp.get("parsed"):
        return {"scenario": resp["parsed"], "raw_ai_output": resp.get("raw")}
    # try parse raw
    try:
        parsed = json.loads(resp.get("raw", "{}"))
        return {"scenario": parsed, "raw_ai_output": resp.get("raw")}
    except Exception:
        return {"scenario": generate_relay_attack().dict(), "raw_ai_output": resp.get("raw")}


async def generate_blue_patch_from_log(attack_log: Dict[str, Any], current_rule: Dict[str, Any]) -> Dict[str, Any]:
    prompt = "You are a defensive AI analyst. Input: attack_log JSON and current_rule JSON. Produce EXACTLY one valid JSON patch with keys: rule_id, trigger_conditions, temporal_window_seconds, coords_radius_meters, required_event_sequence, description. Return only JSON."
    resp = await call_gemini(prompt + "\nAttack log:" + json.dumps(attack_log) + "\nCurrent rule:" + json.dumps(current_rule))
    fallback = {"rule_id":"stateful_handoff_v2","trigger_conditions":[{"event":"drop"}],"temporal_window_seconds":600,"coords_radius_meters":10,"required_event_sequence":["drop","pickup"],"description":"fallback patch suggested by system"}
    if resp.get("error"):
        return {"patch_json": fallback, "raw_ai_output": resp}
    if resp.get("parsed"):
        return {"patch_json": resp.get("parsed"), "raw_ai_output": resp.get("raw")}
    try:
        parsed = json.loads(resp.get("raw", "{}"))
        return {"patch_json": parsed, "raw_ai_output": resp.get("raw")}
    except Exception:
        return {"patch_json": fallback, "raw_ai_output": resp.get("raw")}
