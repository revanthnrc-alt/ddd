"""Simple Gemini client wrapper using httpx AsyncClient."""
import os
import json
import asyncio
from typing import Any, Dict
import httpx
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_ENDPOINT = os.getenv("GEMINI_ENDPOINT", "https://api.generativeai.example/v1/generate")


async def call_gemini(prompt: str, max_tokens: int = 512) -> Dict[str, Any]:
    """Call Gemini (placeholder). Returns parsed JSON when possible or raw text.

    TODO: Replace GEMINI_ENDPOINT and ensure GOOGLE_API_KEY is set in .env
    """
    headers = {"Content-Type": "application/json"}
    if GOOGLE_API_KEY:
        headers["Authorization"] = f"Bearer {GOOGLE_API_KEY}"

    payload = {"prompt": prompt, "max_tokens": max_tokens}

    retries = 2
    backoff = 0.5
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(retries + 1):
            try:
                resp = await client.post(GEMINI_ENDPOINT, headers=headers, json=payload)
                text = resp.text
                # Try parse JSON
                try:
                    return {"success": True, "content": resp.json()}
                except Exception:
                    return {"success": True, "content": text}
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                if attempt < retries:
                    await asyncio.sleep(backoff * (attempt + 1))
                    continue
                return {"success": False, "content": str(e)}
