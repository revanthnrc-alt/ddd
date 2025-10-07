"""FastAPI entry point for backen package."""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from backen.routes import simulation, ai_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backen")

app = FastAPI(title="Relay Attack Backend", version="0.1")

origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router, prefix="/simulate", tags=["simulate"])
app.include_router(ai_engine.router, prefix="/ai", tags=["ai"])


@app.get("/")
async def root():
    return {"status": "Backend Active", "version": "0.1"}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting backen app on http://127.0.0.1:8000")
    uvicorn.run("backen.main:app", host="0.0.0.0", port=8000, reload=True)
