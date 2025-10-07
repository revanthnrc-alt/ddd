"""Pydantic schemas for API inputs and outputs."""
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


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
    zone: Optional[Dict[str, Any]] = None
    event_sequence: List[EventModel]


class AlertModel(BaseModel):
    alert_id: str
    level: str
    evidence: List[Dict[str, Any]]


class RunResultModel(BaseModel):
    detected: bool
    alerts: List[AlertModel]
    bypassed_events_count: int
    event_count: int
    scenario: ScenarioModel
    raw_ai_output: Optional[Any] = None


class RuleModel(BaseModel):
    rule_id: str
    rule_json: Dict[str, Any]
    description: Optional[str] = ""
    active: Optional[bool] = True


class PatchModel(BaseModel):
    patch_id: Optional[str]
    patch_json: Optional[Dict[str, Any]]
    description: Optional[str]


class GeminiResponse(BaseModel):
    success: bool
    content: Any
