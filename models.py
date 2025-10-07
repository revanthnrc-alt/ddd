"""SQLAlchemy models for rules, events, patches, and simulation runs."""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


def gen_id(prefix: str = "id") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String, unique=True, index=True, nullable=False)
    rule_json = Column(JSON, nullable=False)
    description = Column(String, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventLog(Base):
    __tablename__ = "event_logs"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String, index=True)
    event_index = Column(Integer)
    entity_id = Column(String)
    entity_type = Column(String)
    action = Column(String)
    coords = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # 'metadata' is reserved at the class level in SQLAlchemy declarative API,
    # so store event metadata under 'meta' column name instead.
    meta = Column(JSON)
    result = Column(Text)


class Patch(Base):
    __tablename__ = "patches"
    id = Column(Integer, primary_key=True, index=True)
    patch_id = Column(String, unique=True, index=True, nullable=False)
    patch_json = Column(JSON, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True, nullable=False)
    rule_id = Column(String, ForeignKey("rules.rule_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    result_summary = Column(JSON)
