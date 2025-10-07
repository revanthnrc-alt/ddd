# Relay Attack Backend (backen)

Run instructions:

```bash
cd /Users/paranchittamuru/texting/2
python3 -m venv .venv
source .venv/bin/activate
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backen/requirements.txt
python backen/scripts/create_db.py
.venv/bin/python -m uvicorn backen.main:app --reload --port 8000
```

API examples:

Run attack:
```bash
curl -X POST http://127.0.0.1:8000/simulate/run -H "Content-Type: application/json" -d '{}'
```

Generate patch:
```bash
curl -X POST http://127.0.0.1:8000/ai/blue_team -H "Content-Type: application/json" -d '{"attack_log":{}, "current_rule":{}}'
```
