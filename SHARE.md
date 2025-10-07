Quick share instructions for teammates

1) Copy the repo and prepare environment

```bash
git clone https://github.com/<your-org-or-username>/<repo>.git
cd <repo>
cp backen/.env.example backen/.env   # edit keys if you have them
python3 -m venv .venv
source .venv/bin/activate
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backen/requirements.txt
```

2) Seed DB and run backend

```bash
# seed DB
.venv/bin/python scripts/create_db.py
# start backend (from repo root)
.venv/bin/python -m uvicorn backen.main:app --reload --port 8000
```

3) Start frontend

```bash
npm install
npm run dev
# open the Vite URL (likely http://localhost:5173 or auto-chosen port)
```

Notes:
- Do NOT commit .env with real keys. Use backen/.env.example as template.
- The backend uses sqlite (relay.db). You can remove it before sharing if you want an empty DB.
- If ports are busy, pick alternate ports (uvicorn --port 8001).

Optional: If you'd like, I can also add Dockerfiles and a docker-compose.yml to make sharing as simple as `docker-compose up --build`.
