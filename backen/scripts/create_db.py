"""Create DB and seed default rule for backen package."""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backen.database import create_tables, SessionLocal
from backen.models import Rule


def main():
    create_tables()
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
