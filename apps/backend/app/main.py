from pathlib import Path
from typing import Any, Dict
import json

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="bpstudio-backend", version="0.1.0")


@app.get("/healthz")
def healthz() -> Dict[str, bool]:
    return {"ok": True}


class McpConnection(BaseModel):
    serverUrl: str
    token: str


@app.post("/mcp/test-connection")
def mcp_test_connection(_: McpConnection) -> Dict[str, Any]:
    # Mock tool list response for now
    return {
        "ok": True,
        "tools": [
            {"name": "query_supabase", "description": "Query Supabase tables"},
            {"name": "summarize", "description": "Summarize text content"},
        ],
    }


@app.get("/schemas")
def schemas() -> Dict[str, Any]:
    base = Path(__file__).resolve().parents[3]  # repo root
    intents_schema = base / "packages" / "shared" / "schemas" / "intents.schema.json"
    agent_schema = base / "packages" / "shared" / "schemas" / "agent_config.schema.json"
    intents: Dict[str, Any] = {}
    agent: Dict[str, Any] = {}
    if intents_schema.exists():
        try:
            intents = json.loads(intents_schema.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            intents = {}
    if agent_schema.exists():
        try:
            agent = json.loads(agent_schema.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            agent = {}

    return {
        "openapi": app.openapi(),
        "schemas": {
            "intents": intents,
            "agent_config": agent,
        },
    }

