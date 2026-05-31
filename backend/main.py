"""
GTSU-110 Flight Data API  |  backend/main.py
=============================================================
FastAPI + SQLite backend. Serves pre-generated flight telemetry
from data/flights.db to the React frontend.

Run:
    pip install fastapi uvicorn
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from typing import Optional, List

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title='GTSU-110 Flight Data API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],   # local dev — restrict in production
    allow_methods=['GET'],
    allow_headers=['*'],
)

DB_PATH = Path(__file__).parent.parent / 'data' / 'flights.db'


# ── DB helper ────────────────────────────────────────────────────────────────
def get_db() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail=f'Database not found at {DB_PATH}. Run: python generate_flight_csv.py',
        )
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


# ── Health ───────────────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return {'status': 'ok', 'db': str(DB_PATH), 'db_exists': DB_PATH.exists()}


# ── Flights list ─────────────────────────────────────────────────────────────
@app.get('/api/flights')
def list_flights():
    """Return all flight metadata (no trace data)."""
    with get_db() as con:
        rows = con.execute(
            'SELECT * FROM flights ORDER BY id'
        ).fetchall()
    return [dict(r) for r in rows]


# ── Single flight + cycle list ────────────────────────────────────────────────
@app.get('/api/flights/{flight_id}')
def get_flight(flight_id: int):
    """Return flight metadata + all cycle summaries (no trace)."""
    with get_db() as con:
        f = con.execute(
            'SELECT * FROM flights WHERE id = ?', (flight_id,)
        ).fetchone()
        if not f:
            raise HTTPException(404, f'Flight {flight_id} not found')
        cycles = con.execute(
            'SELECT * FROM cycles WHERE flight_id = ? ORDER BY cycle_num',
            (flight_id,)
        ).fetchall()
    return {**dict(f), 'cycles': [dict(c) for c in cycles]}


# ── Full trace for a flight (streamed JSON array) ────────────────────────────
@app.get('/api/flights/{flight_id}/trace')
def get_trace(
    flight_id: int,
    cycle: Optional[int] = Query(default=None, description='Filter to a single cycle number'),
):
    """
    Returns the 1-Hz trace rows for a flight.
    Pass ?cycle=N to get only that cycle's rows.
    Full flight trace is typically 7-12 k rows; JSON is ~2-3 MB — OK for local use.
    """
    with get_db() as con:
        if cycle is not None:
            rows = con.execute(
                'SELECT * FROM trace WHERE flight_id = ? AND cycle_num = ? ORDER BY ts',
                (flight_id, cycle),
            ).fetchall()
        else:
            rows = con.execute(
                'SELECT * FROM trace WHERE flight_id = ? ORDER BY ts',
                (flight_id,),
            ).fetchall()
    if not rows:
        raise HTTPException(404, f'No trace data found for flight {flight_id}')
    return [dict(r) for r in rows]


# ── Cycle detail (meta + trace) ───────────────────────────────────────────────
@app.get('/api/flights/{flight_id}/cycles/{cycle_num}')
def get_cycle(flight_id: int, cycle_num: int):
    """Return cycle metadata + its 1-Hz trace."""
    with get_db() as con:
        meta = con.execute(
            'SELECT * FROM cycles WHERE flight_id = ? AND cycle_num = ?',
            (flight_id, cycle_num),
        ).fetchone()
        if not meta:
            raise HTTPException(404, 'Cycle not found')
        trace = con.execute(
            'SELECT * FROM trace WHERE flight_id = ? AND cycle_num = ? ORDER BY ts',
            (flight_id, cycle_num),
        ).fetchall()
    return {**dict(meta), 'trace': [dict(r) for r in trace]}
