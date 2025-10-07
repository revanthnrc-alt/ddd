from pydantic import BaseModel
from typing import List, Optional, Any, Dict


class EventModel(BaseModel):
    entity_id: str
    entity_type: Optional[str] = "unknown"
    action: str
    timestamp_offset_seconds: int
    coords: List[float]
    metadata: Optional[Dict[str, Any]] = None


class ScenarioModel(BaseModel):
    scenario_id: str
    description: Optional[str] = ""
    event_sequence: List[EventModel]


class RuleModel(BaseModel):
    rule_id: str
    rule_json: Dict[str, Any]
    description: Optional[str] = ""
    active: Optional[bool] = True


class PatchModel(BaseModel):
    patch_id: Optional[str]
    patch_json: Optional[Dict[str, Any]]
    description: Optional[str]


class RunResultModel(BaseModel):
    run_id: Optional[str]
    detected: bool
    alerts: List[Dict[str, Any]]
    event_sequence: List[EventModel]
    evidence: Optional[List[str]] = None
    raw_ai_output: Optional[Any] = None


class GeminiResponseModel(BaseModel):
    parsed_json: Optional[Dict[str, Any]]
    raw: Optional[str]
