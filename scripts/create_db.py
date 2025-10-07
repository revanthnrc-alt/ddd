"""Utility to create the SQLite DB and seed a default rule.

This script is safe to run from the repository root. It ensures the project
directory is on sys.path so local imports work when executed from scripts/.
"""
import sys
import os
from pathlib import Path

# Ensure project root is on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import create_tables, engine, SessionLocal
from models import Rule


def main():
    create_tables()
    # seed a default vulnerable loiter rule if none
    db = SessionLocal()
    try:
        exists = db.query(Rule).first()
        if not exists:
            r = Rule(rule_id="loiter_v1", rule_json={"type": "loiter", "loiter_time_seconds": 60, "zone": "Z"}, description="Default loiter detection rule", active=True)
            db.add(r)
            db.commit()
            print("Inserted default rule loiter_v1")
        else:
            print("Rules already present; skipping seeding")
    finally:
        db.close()


if __name__ == "__main__":
    main()
