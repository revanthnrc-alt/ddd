from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from routes import simulation, ai_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("relay_backend")

app = FastAPI(title="Relay Attack Backend", version="0.1")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

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
    """Health check

    Returns a small status JSON.
    """
    return {"status": "Backend Active", "version": "0.1"}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Relay Attack Backend on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
